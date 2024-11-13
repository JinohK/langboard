from typing import Any, TypeVar, overload
from sqlalchemy import Delete, Update, func
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.utils.DateTime import now
from ...models import (
    GlobalTaskRelationshipType,
    Project,
    ProjectColumn,
    Task,
    TaskActivity,
    TaskAssignedUser,
    TaskComment,
    TaskRelationship,
    User,
)
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class TaskService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "task"

    async def get_by_id(self, task_id: int | None) -> Task | None:
        return await self._get_by(Task, "id", task_id)

    async def get_board_tasks(self, project_uid: str) -> list[dict[str, Any]]:
        sql_query = (
            self._db.query("select")
            .columns(
                Task.id,
                Task.uid,
                Task.project_column_uid,
                Task.title,
                Task.description,
                Task.order,
                func.count(TaskComment.column("id")).label("comment_count"),
            )
            .join(Project, Task.column("project_id") == Project.column("id"))
            .outerjoin(TaskComment, Task.column("id") == TaskComment.column("task_id"))
            .where(Project.column("uid") == project_uid)
            .order_by(Task.column("order").asc())
            .group_by(Task.column("id"), Task.column("order"))
        )

        result = await self._db.exec(sql_query)
        raw_tasks = result.all()

        tasks = []

        for task_id, uid, column_uid, title, description, order, comment_count in raw_tasks:
            sql_query = (
                self._db.query("select")
                .table(User)
                .join(TaskAssignedUser, User.column("id") == TaskAssignedUser.column("user_id"))
                .where(TaskAssignedUser.column("task_id") == task_id)
            )

            result = await self._db.exec(sql_query)
            raw_users = result.all()

            sql_query = (
                self._db.query("select")
                .table(TaskRelationship)
                .join(
                    GlobalTaskRelationshipType,
                    TaskRelationship.column("relation_type_id") == GlobalTaskRelationshipType.column("id"),
                )
                .where(
                    (TaskRelationship.column("task_uid_parent") == uid)
                    | (TaskRelationship.column("task_uid_child") == uid)
                )
            )

            result = await self._db.exec(sql_query)
            raw_relationship = result.all()

            parents = []
            children = []
            for relationship in raw_relationship:
                if relationship.task_uid_parent == uid:
                    children.append(relationship.task_uid_child)
                else:
                    parents.append(relationship.task_uid_parent)

            tasks.append(
                {
                    "uid": uid,
                    "column_uid": column_uid,
                    "title": title,
                    "description": description or "",
                    "order": order,
                    "comment_count": comment_count,
                    "members": [user.api_response() for user in raw_users],
                    "relationships": {
                        "parents": parents,
                        "children": children,
                    },
                }
            )

        return tasks

    @ActivityService.activity_method(TaskActivity, ActivityService.ACTIVITY_TYPES.TaskCreated)
    async def create(
        self, user: User, project: Project, column_uid: str, title: str
    ) -> tuple[ActivityResult, Task] | None:
        if not project.id or column_uid == Project.ARCHIVE_COLUMN_UID:
            return None

        result = await self._db.exec(
            self._db.query("select")
            .column(Task.order)
            .where((Task.column("project_column_uid") == column_uid) & (Task.column("project_id") == project.id))
            .order_by(Task.column("order").desc())
            .group_by(Task.column("order"))
            .limit(1)
        )
        last_order = result.first()
        if last_order is None:
            last_order = -1

        task = Task(
            project_id=project.id,
            project_column_uid=column_uid,
            title=title,
            order=last_order + 1,
        )
        self._db.insert(task)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=task,
            shared={"project_uid": project.uid},
            new={"title": title, "column_uid": column_uid},
        )

        return activity_result, task

    @ActivityService.activity_method(TaskActivity, ActivityService.ACTIVITY_TYPES.TaskChangedColumn)
    async def change_task_order(
        self, user: User, task_uid: str, order: int, column_uid: str = ""
    ) -> tuple[ActivityResult | None, bool]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Task, Project, ProjectColumn)
            .join(Project, Project.column("id") == Task.column("project_id"))
            .outerjoin(ProjectColumn, ProjectColumn.column("uid") == Task.column("project_column_uid"))
            .where(Task.uid == task_uid)
            .limit(1)
        )
        record = result.first()
        if not record:
            return None, False
        task, project, original_column = record

        original_column_uid = original_column.uid if original_column else Project.ARCHIVE_COLUMN_UID
        original_column_name = original_column.name if original_column else project.archive_column_name
        if column_uid:
            if column_uid != Project.ARCHIVE_COLUMN_UID:
                column = await self._get_by(ProjectColumn, "uid", column_uid)
                if not column or column.project_id != task.project_id:
                    return None, False

                task.archived_at = None
                task.project_column_uid = column_uid
            else:
                project = await self._get_by(Project, "id", task.project_id)
                if not project:
                    return None, False
                task.archived_at = now()
                task.project_column_uid = None

        original_order = task.order

        shared_update_query = (
            self._db.query("update")
            .table(Task)
            .where((Task.column("id") != task.id) & (Task.column("project_id") == task.project_id))
        )
        if column_uid:
            update_query = self.__filter_column(
                (
                    shared_update_query.values({Task.order: Task.order - 1}).where(
                        (Task.column("order") >= original_order)
                    )
                ),
                original_column_uid,
            )
            await self._db.exec(update_query)

            update_query = self.__filter_column(
                (shared_update_query.values({Task.order: Task.order + 1}).where((Task.column("order") >= order))),
                column_uid,
            )
            await self._db.exec(update_query)
        else:
            update_query = shared_update_query

            if original_order < order:
                update_query = update_query.values({Task.order: Task.order - 1}).where(
                    (Task.column("order") <= order) & (Task.column("order") > original_order)
                )
            else:
                update_query = update_query.values({Task.order: Task.order + 1}).where(
                    (Task.column("order") >= order) & (Task.column("order") < original_order)
                )

            update_query = self.__filter_column(update_query, original_column_uid)
            await self._db.exec(update_query)

        task.order = order
        await self._db.update(task)

        if column_uid:
            activity_result = ActivityResult(
                user_or_bot=user,
                model=task,
                shared={
                    "project_uid": project.uid,
                    "task_uid": task.uid,
                },
                new={
                    "column_uid": column_uid,
                    "column_name": (
                        column.name if column_uid != Project.ARCHIVE_COLUMN_UID else project.archive_column_name
                    ),
                },
                old={
                    "column_uid": original_column_uid,
                    "column_name": original_column_name,
                },
            )
        else:
            activity_result = None
            await self._db.commit()

        return activity_result, True

    @overload
    def __filter_column(self, query: Select[_TSelectParam], column_uid: str) -> Select[_TSelectParam]: ...
    @overload
    def __filter_column(
        self, query: SelectOfScalar[_TSelectParam], column_uid: str
    ) -> SelectOfScalar[_TSelectParam]: ...
    @overload
    def __filter_column(self, query: Update, column_uid: str) -> Update: ...
    @overload
    def __filter_column(self, query: Delete, column_uid: str) -> Delete: ...
    def __filter_column(
        self,
        query: Select[_TSelectParam] | SelectOfScalar[_TSelectParam] | Update | Delete,
        column_uid: str,
    ):
        if column_uid == Project.ARCHIVE_COLUMN_UID:
            return query.where(Task.column("archived_at") != None)  # noqa
        return query.where(Task.column("project_column_uid") == column_uid)

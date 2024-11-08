from typing import Any, TypeVar, overload
from sqlalchemy import Delete, Update
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.utils.DateTime import now
from ...models import Project, ProjectColumn, Task, TaskActivity, User
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class TaskService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "task"

    @ActivityService.activity_method(TaskActivity, ActivityService.ACTIVITY_TYPES.TaskChangedOrder)
    async def change_task_order(
        self, user: User, task_uid: str, order: int, column_uid: str = ""
    ) -> tuple[ActivityResult | None, bool]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Task, Project, ProjectColumn)
            .join(Project, Project.column("id") == Task.column("project_id"))
            .outerjoin(ProjectColumn, ProjectColumn.column("uid") == Task.column("project_column_uid"))
            .where(Task.uid == task_uid)
        )
        record = result.first()
        if not record:
            return None, False
        task, project, original_column = record

        original_column_uid = original_column.uid if original_column else Project.ARCHIVE_COLUMN_UID
        original_column_name = original_column.name if original_column else project.archive_column_name
        if column_uid:
            update_query = (
                self._db.query("update")
                .table(Task)
                .values({Task.order: Task.order - 1})
                .where((Task.column("order") > task.order))
            )

            update_query = self.__filter_column(update_query, column_uid)

            await self._db.exec(update_query)

            if column_uid != Project.ARCHIVE_COLUMN_UID:
                result = await self._db.exec(
                    self._db.query("select").table(ProjectColumn).where(ProjectColumn.uid == column_uid)
                )
                column = result.first()
                if not column or column.project_id != task.project_id:
                    return None, False

                task.archived_at = None
                task.project_column_uid = column_uid
            else:
                result = await self._db.exec(
                    self._db.query("select").table(Project).where(Project.id == task.project_id)
                )
                project = result.first()
                if not project:
                    return None, False
                task.archived_at = now()
                task.project_column_uid = None

        original_order = task.order
        task.order = order

        await self._db.update(task)

        update_query = self._db.query("update").table(Task)
        if column_uid:
            update_query = update_query.values({Task.order: Task.order + 1}).where(
                (Task.column("order") >= order) & (Task.id != task.id) & (Task.project_id == task.project_id)
            )
        else:
            update_query = update_query.where(
                (Task.column("id") != task.id) & (Task.column("project_id") == task.project_id)
            )

            if original_order < order:
                update_query = update_query.values({Task.order: Task.order - 1}).where(
                    (Task.column("order") <= order) & (Task.column("order") > original_order)
                )
            else:
                update_query = update_query.values({Task.order: Task.order + 1}).where(
                    (Task.column("order") >= order) & (Task.column("order") < original_order)
                )
        update_query = self.__filter_column(update_query, column_uid)
        await self._db.exec(update_query)

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

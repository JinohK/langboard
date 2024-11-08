from typing import Any
from sqlalchemy import func
from ...core.schema.Pagination import Pagination
from ...models import Project, ProjectColumn, Task, TaskAssignedUser, TaskComment, User
from ..BaseService import BaseService


class ProjectColumnService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_column"

    async def get_board_tasks(self, project_uid: str, column_uid: str, pagination: Pagination) -> list[dict[str, Any]]:
        sql_query = (
            self._db.query("select")
            .columns(
                Task.id, Task.uid, Task.title, Task.order, func.count(TaskComment.column("id")).label("comment_count")
            )
            .join(Project, Task.column("project_id") == Project.column("id"))
            .where(Project.column("uid") == project_uid)
        )

        if column_uid == Project.ARCHIVE_COLUMN_UID:
            sql_query = sql_query.where(Task.column("archived_at") != None)  # noqa
        else:
            sql_query = sql_query.join(
                ProjectColumn, Task.column("project_column_uid") == ProjectColumn.column("uid")
            ).where(ProjectColumn.column("uid") == column_uid)

        sql_query = sql_query.outerjoin(TaskComment, Task.column("id") == TaskComment.column("task_id"))

        sql_query = sql_query.order_by(Task.column("order").asc()).group_by(Task.column("order"))
        sql_query = self.paginate(sql_query, pagination.page, pagination.limit)

        result = await self._db.exec(sql_query)
        raw_tasks = result.all()

        tasks = []

        for id, uid, title, order, comment_count in raw_tasks:
            sql_query = (
                self._db.query("select")
                .table(User)
                .join(TaskAssignedUser, User.column("id") == TaskAssignedUser.column("user_id"))
                .where(TaskAssignedUser.column("task_id") == id)
            )

            result = await self._db.exec(sql_query)
            raw_users = result.all()

            tasks.append(
                {
                    "uid": uid,
                    "column_uid": column_uid,
                    "title": title,
                    "order": order,
                    "comment_count": comment_count,
                    "members": [user.api_response() for user in raw_users],
                }
            )

        return tasks

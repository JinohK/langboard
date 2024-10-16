from ....core.db import DbSession
from ....models import ProjectRole
from .BaseRoleService import BaseRoleService


class ProjectRoleService(BaseRoleService[ProjectRole]):
    def __init__(self, db: DbSession):
        super().__init__(db, ProjectRole)

    @BaseRoleService.class_filterable_with_ids_wrapper(ProjectRole)  # type: ignore
    async def get_roles(self, **kwargs):
        return await super().get_roles(**kwargs)

    @BaseRoleService.class_init_wrapper(ProjectRole)  # type: ignore
    async def grant(self, **kwargs):
        return await super().grant(**kwargs)

    @BaseRoleService.class_filterable_with_ids_wrapper(ProjectRole)  # type: ignore
    async def grant_all(self, **kwargs):
        return await super().grant_all(**kwargs)

    @BaseRoleService.class_filterable_with_ids_wrapper(ProjectRole)  # type: ignore
    async def grant_default(self, **kwargs):
        return await super().grant_default(**kwargs)

    @BaseRoleService.class_filterable_with_ids_wrapper(ProjectRole)  # type: ignore
    async def withdraw(self, **kwargs):
        return await super().withdraw(**kwargs)

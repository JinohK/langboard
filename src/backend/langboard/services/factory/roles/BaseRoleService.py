from abc import ABC
from typing import Any, Callable, Concatenate, Generic, ParamSpec, Protocol, Sequence, TypeVar, overload
from ....core.db import DbSession
from ....models.BaseRoleModel import BaseRoleModel


_TRoleModel = TypeVar("_TRoleModel", bound=BaseRoleModel)
_TParams = ParamSpec("_TParams")
_TReturn = TypeVar("_TReturn", covariant=True)


class _Method(Protocol, Generic[_TParams, _TReturn]):
    @overload
    def __call__(self_, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore
    @overload
    def __call__(self_, self: Any, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore
    def __call__(self_, self: Any, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore


class BaseRoleService(ABC, Generic[_TRoleModel]):
    @staticmethod
    def class_filterable_wrapper(
        cls_: Callable[Concatenate[Any, Any, Any, Any, Any, Any, _TParams], Any],
    ) -> Callable[[Callable[..., _TReturn]], _Method[_TParams, _TReturn]]:
        """Provides a decorator a class method that provides type hints for the method's parameters and return value.

        If the method needs only top-level variables of the class inherited :class:`BaseRoleModel`, this decorator should be used.

        E.g.::

            class AnyRole(BaseRoleModel):
                any_field: str

            class AnyRoleService(BaseRoleService[AnyRole]):
                @BaseRoleService.class_filterable_wrapper(AnyRole)  # type: ignore
                def grant(self, **kwargs):
                    ...

            AnyRoleService.grant(any_field="any_value")
        """
        return BaseRoleService._class_wrapper(cls_)  # type: ignore

    @staticmethod
    def class_filterable_with_ids_wrapper(
        cls_: Callable[Concatenate[Any, Any, Any, Any, _TParams], Any],
    ) -> Callable[[Callable[..., _TReturn]], _Method[_TParams, _TReturn]]:
        """Provides a decorator a class method that provides type hints for the method's parameters and return value.

        If the method needs a user_id or a group_id parameter, this decorator should be used.

        E.g.::

            class AnyRole(BaseRoleModel):
                any_field: str

            class AnyRoleService(BaseRoleService[AnyRole]):
                @BaseRoleService.class_filterable_with_ids_wrapper(AnyRole)  # type: ignore
                def grant_all(self, user_id: int, **kwargs):
                    ...

            AnyRoleService.grant(user_id=1, group_id=None, any_field="any_value")
        """
        return BaseRoleService._class_wrapper(cls_)  # type: ignore

    @staticmethod
    def class_init_wrapper(
        cls_: Callable[Concatenate[Any, Any, Any, _TParams], Any],
    ) -> Callable[[Callable[..., _TReturn]], _Method[_TParams, _TReturn]]:
        """Provides a decorator a class method that provides type hints for the method's parameters and return value.

        If the method needs all the parameters of the class inherited :class:`BaseRoleModel`, this decorator should be used.

        E.g.::

            class AnyRole(BaseRoleModel):
                any_field: str

            class AnyRoleService(BaseRoleService[AnyRole]):
                @BaseRoleService.class_init_wrapper(AnyRole)  # type: ignore
                def grant(self, **kwargs):
                    ...

            AnyRoleService.grant(actions=[ALL_GRANTED], user_id=1, any_field="any_value")
        """
        return BaseRoleService._class_wrapper(cls_)  # type: ignore

    @staticmethod
    def _class_wrapper(
        cls_: Callable[Concatenate[_TParams], Any],
    ) -> Callable[[Callable[..., _TReturn]], _Method[_TParams, _TReturn]]:
        def spec_decorator(method: Callable[..., _TReturn]) -> _Method[_TParams, _TReturn]:
            def inner(self: Any, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn:
                return method(self, *args, **kwargs)

            return inner  # type: ignore

        return spec_decorator

    def __init__(self, db: DbSession, model_class: type[_TRoleModel]):
        self._db = db
        self._model_class = model_class

    async def get_roles(self, **kwargs) -> Sequence[_TRoleModel]:
        """Get roles by filtering with the given parameters.

        If the given parameters are not in the model's fields or are `None`, they will be ignored.

        If no parameters are given, all roles will be returned.
        """
        query = self._db.query("select").table(self._model_class)

        for arg, value in kwargs.items():
            if arg in self._model_class.model_fields and value is not None:
                query = query.where(getattr(self._model_class, arg) == value)

        result = await self._db.exec(query)
        return result.all()

    async def grant(self, **kwargs) -> bool:
        """Grant actions to the role.

        If both `user_id` and `group_id` are provided, the `user_id` will be used.

        If none of them are provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)

        try:
            if role.is_new():
                self._db.insert(role)
            else:
                await self._db.update(role)
            return True
        except Exception:
            return False

    async def grant_all(self, **kwargs) -> bool:
        """Grant all actions to the role. :meth:`BaseRoleModel.set_all_actions` will be called.

        If both `user_id` and `group_id` are provided, the `user_id` will be used.

        If none of them are provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        role.set_all_actions()

        try:
            if role.is_new():
                self._db.insert(role)
            else:
                await self._db.update(role)
            return True
        except Exception:
            return False

    async def grant_default(self, **kwargs) -> bool:
        """Grant default actions to the role. :meth:`BaseRoleModel.set_default_actions` will be called.

        If both `user_id` and `group_id` are provided, the `user_id` will be used.

        If none of them are provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        role.set_default_actions()

        try:
            if role.is_new():
                self._db.insert(role)
            else:
                await self._db.update(role)
            return True
        except Exception:
            return False

    async def withdraw(self, **kwargs) -> bool:
        """Withdraw the role.

        If both `user_id` and `group_id` are provided, the `user_id` will be used.

        If none of them are provided, a `ValueError` will be raised.

        After the method is executed, db must be committed to save the changes.
        """
        role = await self._get_or_create_role(**kwargs)
        try:
            if role.is_new():
                return False

            await self._db.delete(role)
            return True
        except Exception:
            return False

    async def _get_or_create_role(self, **kwargs) -> _TRoleModel:
        if kwargs.get("user_id", None) is not None:
            target_id_column = self._model_class.user_id
            target_id = kwargs["user_id"]
            if kwargs.get("group_id", None) is not None:
                kwargs.pop("group_id")
        elif kwargs.get("group_id", None) is not None:
            target_id_column = self._model_class.group_id
            target_id = kwargs["group_id"]
            if kwargs.get("user_id", None) is not None:
                kwargs.pop("user_id")
        else:
            raise ValueError("user_id or group_id is required.")

        query = self._db.query("select").table(self._model_class).where(target_id_column == target_id)
        filterable_columns = self._model_class.get_filterable_columns(self._model_class)  # type: ignore
        for arg, value in kwargs.items():
            if arg in filterable_columns and value is not None:
                query = query.where(getattr(self._model_class, arg) == value)

        result = await self._db.exec(query)
        role = result.first()
        return self._model_class(**kwargs) if not role else role

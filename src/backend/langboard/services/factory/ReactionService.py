from sqlalchemy import func
from ...models import User
from ...models.BaseReactionModel import BaseReactionModel
from ..BaseService import BaseService


class ReactionService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "reaction"

    async def get_all(self, model_class: type[BaseReactionModel], target_id: int | str) -> dict[str, list[int]]:
        result = await self._db.exec(
            self._db.query("select")
            .columns(model_class.reaction_type, func.aggregate_strings(model_class.column("user_id"), ","))
            .where(model_class.column(model_class.get_target_column_name()) == target_id)
            .group_by(model_class.column("reaction_type"))
        )
        raw_reactions = result.all()

        reactions = {}
        for reaction_type, user_ids in raw_reactions:
            if not isinstance(user_ids, str):
                user_ids = str(user_ids)
            reactions[reaction_type] = list(map(int, user_ids.split(",")))

        return reactions

    async def toggle(self, user: User, model_class: type[BaseReactionModel], target_id: int | str, reaction_type: str):
        result = await self._db.exec(
            self._db.query("select")
            .table(model_class)
            .where(
                (model_class.column("user_id") == user.id)
                & (model_class.column(model_class.get_target_column_name()) == target_id)
                & (model_class.column("reaction_type") == reaction_type)
            )
        )
        reaction = result.first()

        if reaction:
            await self._db.delete(reaction)
        else:
            reaction_params = {
                "user_id": user.id,
                "reaction_type": reaction_type,
                model_class.get_target_column_name(): target_id,
            }
            reaction = model_class(**reaction_params)
            self._db.insert(reaction)
        await self._db.commit()

from ...core.ai import BotType
from ...core.service import BaseService
from ...models import User
from ...models.BaseReactionModel import BaseReactionModel


class ReactionService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "reaction"

    async def get_all(self, model_class: type[BaseReactionModel], target_id: int | str) -> dict[str, list[int | str]]:
        result = await self._db.exec(
            self._db.query("select")
            .columns(model_class.reaction_type, model_class.column("user_id"), model_class.column("bot_type"))
            .where(model_class.column(model_class.get_target_column_name()) == target_id)
            .group_by(model_class.column("reaction_type"))
        )
        raw_reactions = result.all()

        reactions = {}
        for reaction_type, user_id, bot_type in raw_reactions:
            if reaction_type not in reactions:
                reactions[reaction_type] = []
            if user_id:
                reactions[reaction_type].append(user_id)
            elif bot_type:
                reactions[reaction_type].append(bot_type.name)

        return reactions

    async def toggle(
        self,
        user_or_bot: User | BotType,
        model_class: type[BaseReactionModel],
        target_id: int | str,
        reaction_type: str,
    ) -> bool:
        user_or_bot_column = (
            model_class.column("user_id") if isinstance(user_or_bot, User) else model_class.column("bot_type")
        )
        user_or_bot_id = user_or_bot.id if isinstance(user_or_bot, User) else user_or_bot
        result = await self._db.exec(
            self._db.query("select")
            .table(model_class)
            .where(
                (user_or_bot_column == user_or_bot_id)
                & (model_class.column(model_class.get_target_column_name()) == target_id)
                & (model_class.column("reaction_type") == reaction_type)
            )
        )
        reaction = result.first()
        is_reacted = bool(reaction)

        if is_reacted:
            await self._db.delete(reaction)
        else:
            reaction_params = {
                "reaction_type": reaction_type,
                model_class.get_target_column_name(): target_id,
            }

            if isinstance(user_or_bot, BotType):
                reaction_params["bot_type"] = user_or_bot
            else:
                reaction_params["user_id"] = user_or_bot.id

            reaction = model_class(**reaction_params)
            self._db.insert(reaction)
        await self._db.commit()

        return not is_reacted

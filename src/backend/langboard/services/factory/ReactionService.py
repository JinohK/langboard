from ...core.ai import Bot, BotRunner, BotType
from ...core.db import SnowflakeID, User
from ...core.service import BaseService
from ...models.BaseReactionModel import BaseReactionModel


class ReactionService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "reaction"

    async def get_all(self, model_class: type[BaseReactionModel], target_id: SnowflakeID) -> dict[str, list[str]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(model_class, User)
            .outerjoin(User, model_class.column("user_id") == User.column("id"))
            .where(model_class.column(model_class.get_target_column_name()) == target_id)
        )
        records = result.all()

        bot_configs: dict[BotType, Bot] = {}
        reactions: dict[str, list[str]] = {}
        for reaction, reacted_user in records:
            reaction_type = reaction.reaction_type
            if reaction_type not in reactions:
                reactions[reaction_type] = []
            if reacted_user:
                reactions[reaction_type].append(reacted_user.get_fullname())
            elif reaction.bot_type:
                if reaction.bot_type in bot_configs:
                    reactions[reaction_type].append(bot_configs[reaction.bot_type].display_name)
                else:
                    bot = await BotRunner.get_bot_config(reaction.bot_type)
                    if bot:
                        reactions[reaction_type].append(bot.display_name)

        return reactions

    async def toggle(
        self,
        user_or_bot: User | BotType,
        model_class: type[BaseReactionModel],
        target_id: SnowflakeID,
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

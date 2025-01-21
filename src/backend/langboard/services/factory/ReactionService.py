from ...core.ai import Bot
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...models.BaseReactionModel import BaseReactionModel
from .Types import TUserOrBot


class ReactionService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "reaction"

    async def get_all(self, model_class: type[BaseReactionModel], target_id: SnowflakeID) -> dict[str, list[str]]:
        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.tables(model_class, User, Bot)
                .outerjoin(User, model_class.column("user_id") == User.column("id"))
                .outerjoin(Bot, model_class.column("bot_id") == Bot.column("id"))
                .where(model_class.column(model_class.get_target_column_name()) == target_id)
            )
        records = result.all()

        reactions: dict[str, list[str]] = {}
        for reaction, reacted_user, reacted_bot in records:
            reaction_type = reaction.reaction_type
            if reaction_type not in reactions:
                reactions[reaction_type] = []
            reactions[reaction_type].append(reacted_user.get_uid() if reacted_user else reacted_bot.get_uid())

        return reactions

    async def toggle(
        self,
        user_or_bot: TUserOrBot,
        model_class: type[BaseReactionModel],
        target_id: SnowflakeID,
        reaction_type: str,
    ) -> bool:
        user_or_bot_column = (
            model_class.column("user_id") if isinstance(user_or_bot, User) else model_class.column("bot_id")
        )
        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.table(model_class).where(
                    (user_or_bot_column == user_or_bot.id)
                    & (model_class.column(model_class.get_target_column_name()) == target_id)
                    & (model_class.column("reaction_type") == reaction_type)
                )
            )
        reaction = result.first()
        is_reacted = bool(reaction)

        async with DbSession.use_db() as db:
            if is_reacted:
                await db.delete(reaction)
            else:
                reaction_params = {
                    "reaction_type": reaction_type,
                    model_class.get_target_column_name(): target_id,
                }

                if isinstance(user_or_bot, User):
                    reaction_params["user_id"] = user_or_bot.id
                else:
                    reaction_params["bot_id"] = user_or_bot.id

                reaction = model_class(**reaction_params)
                db.insert(reaction)
            await db.commit()

        return not is_reacted

from typing import Any
from ..db import DbSession
from ..utils.decorators import class_instance, singleton
from .BaseBot import BaseBot
from .Bot import Bot
from .BotResponse import LangchainStreamResponse, LangflowStreamResponse
from .BotType import BotType


@class_instance()
@singleton
class BotRunner:
    def __init__(self):
        self.__bot_factory: dict[BotType, BaseBot] = {}

    async def run(
        self, bot_type: BotType, data: dict[str, Any]
    ) -> str | LangchainStreamResponse | LangflowStreamResponse | None:
        bot = self.__get_bot(bot_type)
        if bot is None:
            return None
        return await bot.run(data)

    async def run_abortable(
        self, bot_type: BotType, data: dict[str, Any], task_id: str
    ) -> str | LangchainStreamResponse | LangflowStreamResponse | None:
        bot = self.__get_bot(bot_type)
        if bot is None:
            return None
        return await bot.run_abortable(data, task_id)

    async def abort(self, bot_type: BotType, task_id: str):
        bot = self.__get_bot(bot_type)
        if bot is None:
            return
        await bot.abort(task_id)

    async def get_bot_config(self, bot_type: BotType, db: DbSession | None = None) -> Bot | None:
        if bot_type not in BaseBot.__bots__:
            return None

        should_close = db is None
        if should_close:
            db = DbSession()

        result = await db.exec(db.query("select").table(Bot).where(Bot.column("bot_type") == bot_type))

        if should_close:
            await db.close()

        return result.first()

    async def is_available(self, bot_type: BotType) -> bool:
        if bot_type not in BaseBot.__bots__:
            return False

        if bot_type not in self.__bot_factory:
            self.__bot_factory[bot_type] = BaseBot.__bots__[bot_type]()

        return await self.__bot_factory[bot_type].is_available()

    def __get_bot(self, bot_type: BotType) -> BaseBot | None:
        if bot_type not in BaseBot.__bots__:
            return None

        if bot_type not in self.__bot_factory:
            self.__bot_factory[bot_type] = BaseBot.__bots__[bot_type]()

        return self.__bot_factory[bot_type]

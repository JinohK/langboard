from typing import Any
from ..utils.decorators import class_instance, singleton
from .BaseBot import BaseBot
from .BotResponse import LangflowStreamResponse
from .InternalBotType import InternalBotType


@class_instance()
@singleton
class BotRunner:
    def __init__(self):
        self.__bot_factory: dict[InternalBotType, BaseBot] = {}

    async def run(self, bot_type: InternalBotType, data: dict[str, Any]) -> str | LangflowStreamResponse | None:
        bot = self.__get_bot(bot_type)
        if bot is None:
            return None
        return await bot.run(data)

    async def run_abortable(
        self, bot_type: InternalBotType, data: dict[str, Any], task_id: str
    ) -> str | LangflowStreamResponse | None:
        bot = self.__get_bot(bot_type)
        if bot is None:
            return None
        return await bot.run_abortable(data, task_id)

    async def abort(self, bot_type: InternalBotType, task_id: str):
        bot = self.__get_bot(bot_type)
        if bot is None:
            return
        await bot.abort(task_id)

    async def upload_file(self, bot_type: InternalBotType, file: Any) -> str | None:
        bot = self.__get_bot(bot_type)
        if bot is None:
            return None
        return await bot.upload_file(file)

    async def is_available(self, bot_type: InternalBotType) -> bool:
        if bot_type not in BaseBot.__bots__:
            return False

        if bot_type not in self.__bot_factory:
            self.__bot_factory[bot_type] = BaseBot.__bots__[bot_type]()

        return await self.__bot_factory[bot_type].is_available()

    def __get_bot(self, bot_type: InternalBotType) -> BaseBot | None:
        if bot_type not in BaseBot.__bots__:
            return None

        if bot_type not in self.__bot_factory:
            self.__bot_factory[bot_type] = BaseBot.__bots__[bot_type]()

        return self.__bot_factory[bot_type]

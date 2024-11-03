from typing import Any
from ..utils.decorators import class_instance, singleton
from .BaseBot import BaseBot
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
        if bot_type not in BaseBot.__bots__:
            return None

        if bot_type not in self.__bot_factory:
            self.__bot_factory[bot_type] = BaseBot.__bots__[bot_type]()

        return await self.__bot_factory[bot_type].run(data)

    def get_bot_name(self, bot_type: BotType) -> str | None:
        if bot_type not in BaseBot.__bots__:
            return None

        return BaseBot.__bots__[bot_type].bot_name()

    async def is_available(self, bot_type: BotType) -> bool:
        if bot_type not in BaseBot.__bots__:
            return False

        if bot_type not in self.__bot_factory:
            self.__bot_factory[bot_type] = BaseBot.__bots__[bot_type]()

        return await self.__bot_factory[bot_type].is_available()

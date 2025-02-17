from ...core.ai import Bot
from ...core.broker import Broker
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.schema("bot_created", {})
@Broker.wrap_async_task_decorator
async def bot_created(bot: Bot):
    await BotTaskHelper.run(bot, "bot_created", {})

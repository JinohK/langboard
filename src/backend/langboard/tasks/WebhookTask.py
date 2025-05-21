from typing import Any
from httpx import post
from ..core.broker import Broker
from ..core.db import DbSession, SqlBuilder
from ..core.setting import AppSetting, AppSettingType
from .models import WebhookModel


@Broker.wrap_async_task_decorator
async def webhook_task(model: WebhookModel):
    await run_webhook(model.event, model.data)


async def run_webhook(event: str, data: dict[str, Any]):
    urls = await _get_webhook_url()
    if not urls:
        return

    for url in urls:
        try:
            res = post(
                url,
                json={"event": event, "data": data},
            )
            if res.status_code != 200:
                Broker.logger.error("Failed to request webhook: %s", res.text)
        except Exception:
            Broker.logger.error("Failed to request webhook: %s", url)


async def _get_webhook_url() -> list[str]:
    async with DbSession.use(readonly=True) as db:
        result = await db.exec(
            SqlBuilder.select.table(AppSetting).where(AppSetting.setting_type == AppSettingType.WebhookUrl)
        )
    raw_setting = result.first()
    if not raw_setting:
        return []
    urls = raw_setting.get_value()
    if not isinstance(urls, list):
        return []

    return urls

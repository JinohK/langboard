from httpx import post
from ..core.broker import Broker, WebhookModel
from ..core.db import DbSession
from ..core.setting import AppSetting, AppSettingType


@Broker.wrap_async_task_decorator
async def run_webhook(model: WebhookModel):
    urls = await _get_webhook_url()
    if not urls:
        return

    for url in urls:
        try:
            res = post(
                url,
                json=model.model_dump(),
            )
            if res.status_code != 200:
                Broker.logger.error("Failed to request webhook: %s", res.text)
        except Exception:
            Broker.logger.error("Failed to request webhook: %s", url)


async def _get_webhook_url() -> list[str]:
    db = DbSession()
    result = await db.exec(
        db.query("select").table(AppSetting).where(AppSetting.setting_type == AppSettingType.WebhookUrl)
    )
    raw_setting = result.first()
    if not raw_setting:
        return []
    urls = raw_setting.get_value()
    if not isinstance(urls, list):
        return []

    await db.close()

    return urls

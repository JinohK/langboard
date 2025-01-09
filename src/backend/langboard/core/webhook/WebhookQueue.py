from json import loads as json_loads
from pathlib import Path
from time import sleep
from httpx import post
from ...Constants import WEBHOOK_QUEUE_DIR, WEBHOOK_TRHEAD_COUNT
from ..db import DbSession
from ..logger import Logger
from ..setting import AppSetting, AppSettingType
from ..utils.DateTime import now
from ..utils.String import create_short_unique_id
from .WebhookModel import WebhookModel


class WebhookQueue:
    __last_thread_index = 0

    @staticmethod
    def add(data_model: WebhookModel) -> None:
        WEBHOOK_QUEUE_DIR.mkdir(parents=True, exist_ok=True)
        file_name = f"{int(now().timestamp())}-{create_short_unique_id(10)}.queue-{WebhookQueue.__last_thread_index}"
        WebhookQueue.__last_thread_index += 1
        if WebhookQueue.__last_thread_index >= WEBHOOK_TRHEAD_COUNT:
            WebhookQueue.__last_thread_index = 0
        file_path = WEBHOOK_QUEUE_DIR / file_name
        with file_path.open("wb") as f:
            f.write(data_model.model_dump_json().encode(encoding="utf-8"))
            f.close()

    def __init__(self, thread_index: int):
        WEBHOOK_QUEUE_DIR.mkdir(parents=True, exist_ok=True)
        self.__logger = Logger.use(f"WebhookQueue thread {thread_index}")
        self.__thread_index = thread_index

    async def loop(self):
        self.__logger.info("Loop started.")
        try:
            while True:
                await self.__loop()
                sleep(1)
        except Exception:
            return

    async def __loop(self):
        file_list = self.__get_file_list()
        if not file_list:
            return

        webhook_urls = await self.__get_webhook_urls()
        for file in file_list:
            await self.__execute(file, webhook_urls)
            file.unlink()
            self.__logger.info("Executed webhook: %s", file.name)

    def __get_file_list(self) -> list[Path]:
        file_list = [file for file in WEBHOOK_QUEUE_DIR.glob(f"*.queue-{self.__thread_index}")]
        return file_list

    async def __execute(self, file: Path, webhook_urls: list[str]):
        with file.open("rb") as f:
            json = f.readline().decode(encoding="utf-8")
            f.close()

        self.__logger.info("Executing webhook: %s", file.name)

        try:
            data = json_loads(json)
            data_model = WebhookModel(**data)
            if not data_model:
                raise Exception
        except Exception:
            self.__logger.error("Failed to load json from file: %s", file.name)
            return

        for webhook_url in webhook_urls:
            try:
                res = post(
                    webhook_url,
                    json=data_model.model_dump(),
                )
                if res.status_code != 200:
                    self.__logger.error("Failed to request webhook: %s", res.text)
            except Exception:
                self.__logger.error("Failed to request webhook: %s", webhook_url)

    async def __get_webhook_urls(self) -> list[str]:
        db = DbSession()
        result = await db.exec(
            db.query("select")
            .column(AppSetting.setting_value)
            .where(AppSetting.setting_type == AppSettingType.WebhookUrl)
        )
        raw_value = result.first()
        if not raw_value:
            return []
        urls = json_loads(raw_value)
        if not isinstance(urls, list):
            return []

        await db.close()

        return urls

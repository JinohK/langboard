from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from core.utils.Converter import json_default
from httpx import TimeoutException, post
from models import BotLog
from models.BaseBotModel import BotPlatform, BotPlatformRunningType
from models.bases import BaseBotLogModel
from models.BotLog import BotLogType
from .....ai import LangboardCalledVariablesComponent
from .....core.logger import Logger
from ..BotTaskDataHelper import BotTaskDataHelper
from .BaseBotRequest import BaseBotRequest


logger = Logger.use("BotTask")


class LangflowRequest(BaseBotRequest):
    async def request(self):
        bot_log = await self._create_log(BotLogType.Info, f"'{self._event}' task started")

        url, request_data = self.__create_request_data()
        if not url or not request_data:
            await self._update_log(bot_log, BotLogType.Error, "Invalid request data")
            return

        headers = self._get_bot_request_headers()

        await self.__try_request(url, headers, request_data, bot_log)

    async def __try_request(
        self,
        url: str,
        headers: dict[str, Any],
        json_data: dict[str, Any],
        bot_log: tuple[BotLog, BaseBotLogModel | None],
        retried: int = 0,
    ):
        res = None
        try:
            res = post(
                url=url,
                headers=headers,
                json=json_data,
                timeout=120,
            )
            res.raise_for_status()
            text = res.text
            logger.info("Successfully requested bot: %s(@%s)", self._bot.name, self._bot.bot_uname)
            await self._update_log(bot_log, BotLogType.Success, text if text else "Successfully executed")
        except TimeoutException as e:
            if retried < 5:
                return await self.__try_request(url, headers, json_data, bot_log, retried + 1)
            logger.error("Timeout while requesting bot: %s", e)
            await self._update_log(bot_log, BotLogType.Error, str(e))
        except Exception as e:
            if res:
                logger.error(
                    "Failed to request bot: %s(@%s) %s: %s",
                    self._bot.name,
                    self._bot.bot_uname,
                    str(res.status_code),
                    res.text,
                )
                await self._update_log(bot_log, BotLogType.Error, f"{res.status_code}: {res.text}")
            else:
                logger.error("Failed to request bot: %s(@%s)", self._bot.name, self._bot.bot_uname)
                await self._update_log(bot_log, BotLogType.Error, str(e))

    def __create_request_data(self):
        session_id = f"{self._bot.get_uid()}-{self._project.get_uid() if self._project else None}"
        if session_id.endswith("-"):
            session_id = session_id[:-1]

        component = LangboardCalledVariablesComponent(
            event=self._event,
            app_api_token=self._bot.app_api_token,
            project_uid=self._project.get_uid() if self._project else None,
            current_runner_type="bot",
            current_runner_data=BotTaskDataHelper.create_user_or_bot(self._bot),
            rest_data=json_loads(json_dumps(self._data, default=json_default)),
        )

        request_data = {
            "input_value": "",
            "input_type": "chat",
            "output_type": "chat",
            "session_id": session_id,
            "session": session_id,
            "run_type": "bot",
            "uid": self._bot.get_uid(),
            "tweaks": {
                **component.to_data(),
                **component.to_tweaks(),
            },
        }

        url = None
        if self._bot.platform == BotPlatform.Default:
            if self._bot.platform_running_type == BotPlatformRunningType.Default:
                url = f"{self._base_url}/api/v1/webhook/{self._bot.id}"
                try:
                    bot_value: dict = json_loads(json_dumps(json_loads(self._bot.value or "{}")))
                    agent_llm = bot_value.pop("agent_llm", "")
                    if not agent_llm:
                        raise ValueError("agent_llm is required for Default platform")

                    if agent_llm in {"Ollama", "LM Studio"}:
                        request_data["tweaks"][agent_llm] = bot_value
                    else:
                        bot_value["agent_llm"] = agent_llm
                        request_data["tweaks"]["Agent"] = bot_value

                    if "system_prompt" in request_data["tweaks"]["Agent"]:
                        system_prompt = request_data["tweaks"]["Agent"].pop("system_prompt", "")
                        request_data["tweaks"]["Prompt"] = {"prompt": system_prompt}

                    if "api_names" in request_data["tweaks"]["Agent"]:
                        api_names = request_data["tweaks"]["Agent"].pop("api_names", [])
                        request_data["tweaks"]["api_names"] = api_names
                        request_data["tweaks"][LangboardCalledVariablesComponent.__name__]["api_names"] = api_names
                except Exception:
                    pass
        elif self._bot.platform == BotPlatform.Langflow:
            if self._bot.platform_running_type == BotPlatformRunningType.Endpoint:
                url = f"{self._base_url}/{self._bot.value.lstrip('/')}"
            elif self._bot.platform_running_type == BotPlatformRunningType.FlowJson:
                url = f"{self._base_url}/api/v1/webhook/{self._bot.id}"

        if not url:
            return None, None
        return url, request_data

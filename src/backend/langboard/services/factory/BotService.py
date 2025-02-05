from json import dumps as json_dumps
from typing import Any, Literal, cast, overload
from ...core.ai import Bot, BotAPIAuthType, BotTrigger, BotTriggerCondition
from ...core.db import DbSession, SqlBuilder
from ...core.service import BaseService
from ...core.setting import AppSetting
from ...core.storage import FileModel
from ...core.utils.IpAddress import is_valid_ipv4_address_or_range, make_valid_ipv4_range
from ...core.utils.String import generate_random_string
from ...models import ProjectAssignedBot
from ...publishers import BotPublisher
from ...tasks.bot import BotDefaultTask
from .Types import TBotParam


class BotService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "bot"

    @overload
    async def get_list(self, as_api: Literal[False], is_setting_response: bool = False) -> list[Bot]: ...
    @overload
    async def get_list(self, as_api: Literal[True], is_setting_response: bool = False) -> list[dict[str, Any]]: ...
    async def get_list(self, as_api: bool, is_setting_response: bool = False) -> list[Bot] | list[dict[str, Any]]:
        bots = await self._get_all(Bot)
        if not as_api:
            return list(bots)
        api_bots = []
        for bot in bots:
            api_bot = bot.api_response(is_setting_response)
            if is_setting_response:
                conditions = await self._get_all_by(BotTrigger, "bot_id", bot.id)
                api_bot["conditions"] = {
                    condition.condition.value: {"is_predefined": condition.is_predefined} for condition in conditions
                }
            api_bots.append(api_bot)
        return api_bots

    async def create(
        self,
        name: str,
        bot_uname: str,
        api_url: str,
        api_auth_type: BotAPIAuthType,
        api_key: str,
        avatar: FileModel | None = None,
    ) -> Bot | None:
        existing_bot = await self._get_by(Bot, "bot_uname", bot_uname)
        if existing_bot:
            return None

        bot = Bot(
            name=name,
            bot_uname=bot_uname,
            avatar=avatar,
            api_url=api_url,
            api_auth_type=api_auth_type,
            api_key=api_key,
            app_api_token=await self.generate_api_key(),
        )

        async with DbSession.use() as db:
            db.insert(bot)
            await db.commit()

        BotPublisher.bot_created(bot)
        BotDefaultTask.bot_created(bot)

        return bot

    async def update(self, bot: TBotParam, form: dict) -> bool | tuple[Bot, dict[str, Any]] | None:
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return None
        mutable_keys = ["name", "bot_uname", "avatar", "api_url", "api_key"]
        unpublishable_keys = ["api_url", "api_key"]

        old_bot_record = {}

        for key in mutable_keys:
            if key not in form or not hasattr(bot, key):
                continue
            old_value = getattr(bot, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_bot_record[key] = self._convert_to_python(old_value)
            setattr(bot, key, new_value)

        if "bot_uname" in form:
            existing_bot = await self._get_by(Bot, "bot_uname", form["bot_uname"])
            if existing_bot:
                return False

        if "delete_avatar" in form and form["delete_avatar"]:
            old_bot_record["avatar"] = self._convert_to_python(bot.avatar)
            bot.avatar = None

        if not old_bot_record:
            return True

        async with DbSession.use() as db:
            await db.update(bot)
            await db.commit()

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_bot_record or key in unpublishable_keys:
                continue
            if key == "avatar":
                if bot.avatar:
                    model[key] = bot.avatar.path
                else:
                    model["deleted_avatar"] = True
            else:
                model[key] = self._convert_to_python(getattr(bot, key))

        BotPublisher.bot_updated(bot.get_uid(), model)

        model = {**model}
        for key in unpublishable_keys:
            if key in old_bot_record:
                model[key] = self._convert_to_python(getattr(bot, key))

        return bot, model

    async def predefine_conditions(self, bot: TBotParam, conditions: list[BotTriggerCondition]):
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return False

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(BotTrigger).where(
                    (BotTrigger.column("bot_id") == bot.id)
                    & (BotTrigger.column("condition").in_([condition.value for condition in conditions]))
                )
            )

        for condition in conditions:
            trigger = BotTrigger(bot_id=bot.id, condition=condition, is_predefined=True)
            async with DbSession.use() as db:
                db.insert(trigger)
                await db.commit()

        return True

    async def toggle_condition(self, bot: TBotParam, condition: BotTriggerCondition):
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return False

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(BotTrigger).where(
                    (BotTrigger.column("bot_id") == bot.id) & (BotTrigger.column("condition") == condition)
                )
            )
        trigger = result.first()
        if trigger:
            if trigger.is_predefined:
                return False
            async with DbSession.use() as db:
                await db.delete(trigger)
                await db.commit()
        else:
            trigger = BotTrigger(bot_id=bot.id, condition=condition)
            async with DbSession.use() as db:
                db.insert(trigger)
                await db.commit()

        return True

    async def update_ip_whitelist(self, bot: TBotParam, ip_whitelist: list[str]) -> bool | tuple[Bot, dict[str, Any]]:
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return False

        valid_ip_whitelist = []
        for ip in ip_whitelist:
            if not is_valid_ipv4_address_or_range(ip):
                continue
            if ip.endswith("/24"):
                ip = make_valid_ipv4_range(ip)
            valid_ip_whitelist.append(ip)

        bot.ip_whitelist = valid_ip_whitelist
        async with DbSession.use() as db:
            await db.update(bot)
            await db.commit()

        return bot, {"ip_whitelist": valid_ip_whitelist}

    async def generate_new_api_token(self, bot: TBotParam) -> Bot | None:
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return None

        bot.app_api_token = await self.generate_api_key()
        async with DbSession.use() as db:
            await db.update(bot)
            await db.commit()

        return bot

    async def delete(self, bot: TBotParam) -> bool:
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return False

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(ProjectAssignedBot).where(ProjectAssignedBot.column("bot_id") == bot.id)
            )
            await db.commit()

        async with DbSession.use() as db:
            await db.delete(bot)
            await db.commit()

        BotPublisher.bot_deleted(bot.get_uid())

        return True

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = await self._get_by(AppSetting, "setting_value", json_dumps(api_key))
            if not is_existed:
                break
            api_key = f"sk-{generate_random_string(53)}"
        return api_key

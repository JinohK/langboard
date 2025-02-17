from json import loads as json_loads
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import SecretStr
from ...Constants import (
    BASE_DIR,
    MAIL_FROM,
    MAIL_PASSWORD,
    MAIL_PORT,
    MAIL_SERVER,
    MAIL_SSL_TLS,
    MAIL_STARTTLS,
    MAIL_USERNAME,
    PROJECT_NAME,
)
from ...core.service import BaseService
from ...locales.EmailTemplateNames import TEmailTemplateNames


class EmailService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "email"

    async def send_template(
        self, lang: str, to: str, template_name: TEmailTemplateNames, formats: dict[str, str]
    ) -> bool:
        if not self.__create_config():
            return False

        subject, template = self.__get_template(lang, template_name)
        subject = self.__create_subject(subject)
        body = template.format_map(formats)  # noqa

        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=body,
            subtype=MessageType.html,
        )

        fm = FastMail(self.__config)
        await fm.send_message(message)

        return True

    def __create_config(self) -> bool:
        if hasattr(self, "__config"):
            return True

        try:
            self.__config = ConnectionConfig(
                MAIL_FROM=MAIL_FROM,
                MAIL_USERNAME=MAIL_USERNAME,
                MAIL_PASSWORD=SecretStr(MAIL_PASSWORD),
                MAIL_PORT=int(MAIL_PORT),
                MAIL_SERVER=MAIL_SERVER,
                MAIL_STARTTLS=MAIL_STARTTLS,
                MAIL_SSL_TLS=MAIL_SSL_TLS,
                TIMEOUT=5,
            )
            return True
        except Exception:
            return False

    def __get_template(self, lang: str, template_name: TEmailTemplateNames) -> tuple[str, str]:
        locale_path = BASE_DIR / "locales" / lang
        template_path = locale_path / f"{template_name}_email.html"
        lang_path = locale_path / "lang.json"

        template = template_path.read_text()
        locale = json_loads(lang_path.read_text())

        return locale["subjects"][template_name], template

    def __create_subject(self, subject: str) -> str:
        return f"[{PROJECT_NAME.capitalize()}] {subject}"

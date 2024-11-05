from json import loads as json_loads
from typing import Literal
from ...Constants import BASE_DIR, PROJECT_NAME
from ..BaseService import BaseService


_TTemplateNames = Literal["recovery", "signup", "subemail"]


class EmailService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "email"

    async def send_template(self, lang: str, to: str, template_name: _TTemplateNames, formats: dict[str, str]) -> bool:
        subject, template = self.__get_template(lang, template_name)
        subject = self.__create_subject(subject)
        body = template.format_map(formats)  # noqa

        # TODO: Email, implement email sending

        return True

    def __get_template(self, lang: str, template_name: _TTemplateNames) -> tuple[str, str]:
        locale_path = BASE_DIR / "locales" / lang
        template_path = locale_path / f"{template_name}_email.html"
        lang_path = locale_path / "lang.json"

        template = template_path.read_text()
        locale = json_loads(lang_path.read_text())

        return locale["subjects"][template_name], template

    def __create_subject(self, subject: str) -> str:
        return f"[{PROJECT_NAME.capitalize()}] {subject}"

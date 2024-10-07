import { Button, ButtonProps, DropdownMenu } from "@radix-ui/themes";
import IconComponent from "@/components/base/IconComponent";
import { useTranslation } from "react-i18next";

export interface ILanguageSwitcherProps {
    variant?: ButtonProps["variant"];
    triggerType?: "icon" | "text";
}

function LanguageSwitcher({ variant, triggerType }: ILanguageSwitcherProps): JSX.Element {
    const [t, i18n] = useTranslation();

    const changeLanguageHandler = (lang: string) => {
        if (!i18n.languages.includes(lang)) {
            return;
        }

        i18n.changeLanguage(lang);
    };

    const langs = i18n.languages.filter((locale) => locale !== i18n.language);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant={variant ?? "soft"} data-as-block>
                    {triggerType === "text" ? (
                        t(`locales.${i18n.language}`)
                    ) : (
                        <IconComponent name={`flag-${i18n.language.split("-").pop()}`} />
                    )}
                    <DropdownMenu.TriggerIcon className="ml-3" />
                </Button>
            </DropdownMenu.Trigger>

            {langs.length === 0 ? null : (
                <DropdownMenu.Content>
                    {langs.map((locale) => {
                        return (
                            <DropdownMenu.Item onClick={() => changeLanguageHandler(locale)} key={locale}>
                                <IconComponent name={`flag-${locale.split("-").pop()}`} />
                                {t(`locales.${locale}`)}
                            </DropdownMenu.Item>
                        );
                    })}
                </DropdownMenu.Content>
            )}
        </DropdownMenu.Root>
    );
}

export default LanguageSwitcher;

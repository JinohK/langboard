import { useTranslation } from "react-i18next";
import { Button, ButtonProps, DropdownMenu, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";

export interface ILanguageSwitcherProps {
    variant?: ButtonProps["variant"];
    triggerType?: "icon" | "text";
    buttonClassNames?: string;
    hideTriggerIcon?: bool;
    size?: ButtonProps["size"];
}

function LanguageSwitcher({ variant, triggerType, buttonClassNames, hideTriggerIcon, size = "default" }: ILanguageSwitcherProps): JSX.Element {
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
            <DropdownMenu.Trigger asChild>
                <Button variant={variant ?? "default"} className={cn("inline-flex", buttonClassNames)} title={t("locales.title")} size={size}>
                    {triggerType === "text" ? t(`locales.${i18n.language}`) : <IconComponent icon={`country-${i18n.language.split("-").pop()}`} />}
                    {hideTriggerIcon ? null : <IconComponent icon="chevron-down" size="4" className="ml-3" />}
                </Button>
            </DropdownMenu.Trigger>

            {langs.length === 0 ? null : (
                <DropdownMenu.Content>
                    {langs.map((locale) => {
                        return (
                            <DropdownMenu.Item onClick={() => changeLanguageHandler(locale)} key={locale} className="cursor-pointer">
                                <IconComponent icon={`country-${locale.split("-").pop()}`} className="mr-2" />
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

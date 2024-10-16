import { Button, ButtonProps, DropdownMenu, IconComponent } from "@/components/base";
import { classNames } from "@/core/utils/ComponentUtils";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

export interface IThemeSwitcherProps {
    variant?: ButtonProps["variant"];
    triggerType?: "icon" | "text";
    buttonClassNames?: string;
    hideTriggerIcon?: boolean;
}

const themes: Record<string, string> = {
    dark: "moon",
    light: "sun",
    system: "contrast",
};

function ThemeSwitcher({ variant, triggerType, buttonClassNames, hideTriggerIcon }: IThemeSwitcherProps): JSX.Element {
    const { theme, setTheme } = useTheme();
    const [t] = useTranslation();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Button
                    variant={variant ?? "default"}
                    className={classNames("inline-flex", buttonClassNames)}
                    title={t("themes.title")}
                >
                    {triggerType === "text" ? (
                        t(`themes.${theme ?? "system"}`)
                    ) : (
                        <IconComponent icon={themes[theme ?? "system"]} />
                    )}
                    {hideTriggerIcon ? null : <IconComponent icon="chevron-down" size="4" className="ml-3" />}
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                {Object.keys(themes).map((mode) => {
                    return (
                        <DropdownMenu.Item
                            onClick={() => setTheme(mode.toLowerCase())}
                            key={mode}
                            className="cursor-pointer"
                        >
                            <IconComponent icon={themes[mode]} className="mr-2" />
                            {t(`themes.${mode}`)}
                        </DropdownMenu.Item>
                    );
                })}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default ThemeSwitcher;

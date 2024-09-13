import { Button, ButtonProps, DropdownMenu } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import IconComponent from "@/components/base/IconComponent";
import { useTranslation } from "react-i18next";

export interface IThemeSwitcherProps {
    variant?: ButtonProps["variant"];
    triggerType?: "icon" | "text";
}

const themes: Record<string, string> = {
    dark: "moon",
    light: "sun",
    system: "contrast",
};

function ThemeSwitcher({ variant, triggerType }: IThemeSwitcherProps): JSX.Element {
    const { theme, setTheme } = useTheme();
    const [t] = useTranslation();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant={variant ?? "soft"} data-as-block>
                    {triggerType === "text" ? (
                        t(`themes.${theme ?? "system"}`)
                    ) : (
                        <IconComponent name={themes[theme ?? "system"]} />
                    )}
                    <DropdownMenu.TriggerIcon className="ml-3" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                {Object.keys(themes).map((mode) => {
                    return (
                        <DropdownMenu.Item onClick={() => setTheme(mode.toLowerCase())} key={mode}>
                            <IconComponent name={themes[mode]} />
                            {t(`themes.${mode}`)}
                        </DropdownMenu.Item>
                    );
                })}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default ThemeSwitcher;

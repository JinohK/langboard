import { ButtonVariants, IconComponent, Tooltip } from "@/components/base";
import { TSidebarNavItemsProps } from "@/components/Sidebar/types";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID, makeReactKey } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";

function NavItems({ isCollapsed, isFloating, navs }: TSidebarNavItemsProps): JSX.Element[] {
    const [t] = useTranslation();

    return navs.map((item) => {
        const key = makeReactKey(item.name);
        const componentClasses = cn(
            item.current ? "bg-muted text-primary" : "text-muted-foreground",
            "inline-flex cursor-pointer items-center gap-3 rounded-lg py-2 text-base transition-all hover:text-primary",
            isCollapsed ? "" : "px-3"
        );

        let sharedComponent;
        if (typeof isFloating === "boolean") {
            sharedComponent = (
                <a
                    key={key}
                    href={item.href}
                    onClick={item.onClick}
                    aria-current={item.current ? "page" : undefined}
                    className={ButtonVariants({
                        variant: "secondary",
                        size: "icon",
                        className: "h-12 w-12 cursor-pointer rounded-full opacity-50 sm:h-14 sm:w-14",
                    })}
                >
                    <IconComponent icon={item.icon} size="6" strokeWidth="2" />
                </a>
            );
        } else {
            sharedComponent = (
                <a key={key} href={item.href} onClick={item.onClick} aria-current={item.current ? "page" : undefined} className={componentClasses}>
                    <IconComponent icon={item.icon} size={isCollapsed ? "9" : "5"} strokeWidth={isCollapsed ? "1" : "2"} />
                    {isCollapsed ? "" : t(item.name)}
                </a>
            );
        }

        let itemComponent;
        if (isCollapsed || isFloating) {
            itemComponent = (
                <Tooltip.Provider delayDuration={400} key={createShortUUID()}>
                    <Tooltip.Root>
                        <Tooltip.Trigger asChild>{sharedComponent}</Tooltip.Trigger>
                        <Tooltip.Content side="right">{t(item.name)}</Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            );
        } else {
            itemComponent = sharedComponent;
        }

        return itemComponent;
    });
}

export default NavItems;

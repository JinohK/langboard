import { IconComponent, Tooltip } from "@/components/base";
import { ISidebarNavItemsProps } from "@/components/Sidebar/types";
import { classNames } from "@/core/utils/ComponentUtils";
import { useTranslation } from "react-i18next";

function NavItems({ isCollapsed, navs }: ISidebarNavItemsProps): JSX.Element[] {
    const [t] = useTranslation();

    return navs.map((item) => {
        const key = item.name.replace(/(\.|\s)/g, "-");
        const componentClasses = classNames(
            item.current ? "bg-muted text-primary" : "text-muted-foreground",
            "flex cursor-pointer items-center gap-3 rounded-lg py-2 text-base transition-all hover:text-primary",
            isCollapsed ? "" : "px-3"
        );

        const sharedComponent = (
            <a
                key={key}
                href={item.href}
                onClick={item.onClick}
                aria-current={item.current ? "page" : undefined}
                className={componentClasses}
            >
                <IconComponent icon={item.icon} size={isCollapsed ? "9" : "5"} strokeWidth={isCollapsed ? "1" : "2"} />
                {isCollapsed ? "" : t(item.name)}
            </a>
        );

        let itemComponent;
        if (isCollapsed) {
            itemComponent = (
                <Tooltip.Provider delayDuration={400}>
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

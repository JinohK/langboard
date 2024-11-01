import { ButtonVariants, IconComponent, Tooltip } from "@/components/base";
import { TSidebarNavItemsProps } from "@/components/Sidebar/types";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID, makeReactKey } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const NavItems = memo(({ isFloating, navs }: TSidebarNavItemsProps): JSX.Element[] => {
    const [t] = useTranslation();

    return navs.map((item) => {
        const key = makeReactKey(item.name);
        const componentClasses = cn(
            item.current ? "text-primary group-data-[collapsed=false]/sidebar:bg-muted" : "text-muted-foreground",
            "inline-flex cursor-pointer items-center gap-3 rounded-lg py-2 text-base w-full",
            "transition-all duration-100 hover:text-primary",
            "group-data-[collapsed=false]/sidebar:px-3"
        );

        let comp;
        if (TypeUtils.isBool(isFloating)) {
            comp = (
                <a
                    key={key}
                    href={item.href}
                    onClick={item.onClick}
                    aria-current={item.current ? "page" : undefined}
                    className={ButtonVariants({
                        variant: "secondary",
                        size: "icon",
                        className: cn(item.current ? "bg-muted text-primary" : "", "size-12 cursor-pointer rounded-full opacity-50 sm:size-14"),
                    })}
                >
                    <IconComponent icon={item.icon} size="6" strokeWidth="2" />
                </a>
            );
        } else {
            comp = (
                <a key={key} href={item.href} onClick={item.onClick} aria-current={item.current ? "page" : undefined} className={componentClasses}>
                    <IconComponent
                        icon={item.icon}
                        className={cn(
                            "max-h-5 min-h-5 min-w-5 max-w-5",
                            "group-data-[collapsed=true]/sidebar:min-h-9 group-data-[collapsed=true]/sidebar:min-w-9",
                            "group-data-[collapsed=true]/sidebar:max-h-9 group-data-[collapsed=true]/sidebar:max-w-9",
                            "stroke-2 transition-all duration-100 group-data-[collapsed=true]/sidebar:stroke-1"
                        )}
                    />
                    <span className="hidden truncate transition-all duration-100 group-data-[collapsed=false]/sidebar:block">{t(item.name)}</span>
                </a>
            );
        }

        return (
            <Tooltip.Provider delayDuration={400} key={createShortUUID()}>
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>{comp}</Tooltip.Trigger>
                    <Tooltip.Content side="right" className="hidden group-data-[collapsed=true]/sidebar:block">
                        {t(item.name)}
                    </Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        );
    });
});

export default NavItems;

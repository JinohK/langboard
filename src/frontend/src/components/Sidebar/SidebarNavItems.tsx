import { forwardRef, memo } from "react";
import { ISidebarNavItem, TSidebarNavItemsProps } from "@/components/Sidebar/types";
import { ButtonVariants, IconComponent, Tooltip } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID, makeReactKey } from "@/core/utils/StringUtils";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";

const SidebarNavItems = memo(({ isFloating, navs }: TSidebarNavItemsProps): JSX.Element => {
    return (
        <>
            {navs.map((item) => {
                const key = makeReactKey(item.name);
                const Comp = isFloating ? FloatingNavItem : SidebarNavItem;

                return (
                    <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION} key={createShortUUID()}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <span>
                                    <Comp key={key} item={item} />
                                </span>
                            </Tooltip.Trigger>
                            <Tooltip.Content side="right" className="group-data-[collapsed=true]/sidebar:block">
                                {item.name}
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                );
            })}
        </>
    );
});

interface ISidebarNavItemProps {
    item: ISidebarNavItem;
}

const FloatingNavItem = forwardRef<HTMLAnchorElement, ISidebarNavItemProps>(({ item, ...props }, ref): JSX.Element => {
    const { setIsLoadingRef } = usePageHeader();

    return (
        <a
            href={item.href}
            onClick={() => {
                item.onClick?.();
                if (item.current) {
                    setTimeout(() => {
                        setIsLoadingRef.current(false);
                    }, 0);
                }
            }}
            aria-current={item.current ? "page" : undefined}
            className={ButtonVariants({
                variant: "secondary",
                size: "icon",
                className: cn(item.current ? "bg-muted text-primary" : "", "size-12 cursor-pointer rounded-full opacity-50 sm:size-14"),
            })}
            ref={ref}
            {...props}
        >
            <IconComponent icon={item.icon} size="6" strokeWidth="2" />
        </a>
    );
});

const SidebarNavItem = forwardRef<HTMLAnchorElement, ISidebarNavItemProps>(({ item, ...props }, ref): JSX.Element => {
    const { setIsLoadingRef } = usePageHeader();

    return (
        <a
            {...props}
            href={item.href}
            onClick={() => {
                item.onClick?.();
                if (item.current) {
                    setTimeout(() => {
                        setIsLoadingRef.current(false);
                    }, 0);
                }
            }}
            aria-current={item.current ? "page" : undefined}
            className={cn(
                item.current ? "text-primary group-data-[collapsed=false]/sidebar:bg-muted" : "text-muted-foreground",
                "select-none group-data-[fullscreen=false]/floating:justify-center",
                "inline-flex w-full cursor-pointer items-center gap-3 rounded-lg py-2 text-base",
                "transition-all duration-100 hover:text-primary",
                "group-data-[collapsed=false]/sidebar:px-3"
            )}
            ref={ref}
        >
            <IconComponent
                icon={item.icon}
                className={cn(
                    "max-h-5 min-h-5 min-w-5 max-w-5",
                    "group-data-[collapsed=true]/sidebar:min-h-9 group-data-[collapsed=true]/sidebar:min-w-9",
                    "group-data-[collapsed=true]/sidebar:max-h-9 group-data-[collapsed=true]/sidebar:max-w-9",
                    "group-data-[fullscreen=false]/floating:min-h-9 group-data-[fullscreen=false]/floating:min-w-9",
                    "group-data-[fullscreen=false]/floating:max-h-9 group-data-[fullscreen=false]/floating:max-w-9",
                    "stroke-2 transition-all duration-100 group-data-[collapsed=true]/sidebar:stroke-1"
                )}
            />
            <span className="hidden truncate transition-all duration-100 group-data-[collapsed=false]/sidebar:block">{item.name}</span>
        </a>
    );
});

export default SidebarNavItems;

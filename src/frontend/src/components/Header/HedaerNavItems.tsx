import { IHeaderNavItem, THeaderNavItemsProps } from "@/components/Header/types";
import { Accordion, DropdownMenu, NavigationMenu } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { makeReactKey } from "@/core/utils/StringUtils";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { useRef, useState } from "react";

interface IDropdownMenuNavProps {
    setDropdownMenuOpenedRef?: React.RefObject<React.Dispatch<React.SetStateAction<bool>>>;
}

function HedaerNavItems({
    isMobile,
    navs,
    setIsOpen,
    activatedClass,
    deactivatedClass,
    shardClass,
    setDropdownMenuOpenedRef,
}: THeaderNavItemsProps & IDropdownMenuNavProps): JSX.Element {
    return (
        <>
            {navs.map((item) => {
                const key = makeReactKey(item.name);
                let Comp;
                if (isMobile) {
                    Comp = item.subNavs ? AccordionNav : AccordionNavItem;
                } else {
                    Comp = item.subNavs ? DropdownMenuNav : NavLinkItem;
                }

                return (
                    <Comp
                        key={key}
                        item={item}
                        setIsOpen={setIsOpen}
                        activatedClass={activatedClass}
                        deactivatedClass={deactivatedClass}
                        shardClass={shardClass}
                        setDropdownMenuOpenedRef={setDropdownMenuOpenedRef}
                    />
                );
            })}
        </>
    );
}

interface IHeaderNavItemProps extends Omit<THeaderNavItemsProps, "isMobile" | "navs">, IDropdownMenuNavProps {
    item: IHeaderNavItem;
}

function AccordionNav({ item, setIsOpen, activatedClass, deactivatedClass, shardClass }: IHeaderNavItemProps): JSX.Element {
    const key = makeReactKey(item.name);
    const subProps = {
        isMobile: true as false,
        navs: item.subNavs!,
        setIsOpen,
        activatedClass,
        deactivatedClass,
        shardClass: cn(shardClass, "py-2"),
    };

    return (
        <Accordion.Root type="single" collapsible>
            <Accordion.Item value={key} className="border-b-0">
                <Accordion.Trigger
                    className={cn("py-2", item.active ? activatedClass : deactivatedClass, shardClass)}
                    disabled={subProps.navs!.length === 0}
                    hidden={item.hidden}
                >
                    {item.name}
                </Accordion.Trigger>
                <Accordion.Content className="pb-0 pl-4 pt-2">
                    <HedaerNavItems {...subProps} />
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    );
}

function DropdownMenuNav({ item, setIsOpen, activatedClass, deactivatedClass, shardClass }: IHeaderNavItemProps): JSX.Element {
    const [isOpened, setIsOpened] = useState(false);
    const setDropdownMenuOpenedRef = useRef(setIsOpened);
    setDropdownMenuOpenedRef.current = setIsOpened;
    const subProps = {
        isMobile: false as const,
        navs: item.subNavs!,
        setIsOpen,
        activatedClass,
        deactivatedClass,
        shardClass: cn(shardClass, "w-full justify-stretch"),
        setDropdownMenuOpenedRef,
    };

    return (
        <NavigationMenu.Item hidden={item.hidden}>
            <DropdownMenu.Root open={isOpened} onOpenChange={setIsOpened}>
                <DropdownMenu.Trigger asChild>
                    <NavigationMenu.Trigger data-active={item.active ? true : null} disabled={subProps.navs!.length === 0} hidden={item.hidden}>
                        {item.name}
                    </NavigationMenu.Trigger>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    <ul className="max-h-80 overflow-y-auto">
                        <HedaerNavItems {...subProps} />
                    </ul>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </NavigationMenu.Item>
    );
}

function AccordionNavItem({ item, setIsOpen, activatedClass, deactivatedClass, shardClass }: IHeaderNavItemProps): JSX.Element {
    const { setIsLoadingRef } = usePageHeader();
    const ariaCurrent = item.active ? "page" : undefined;

    return (
        <a
            aria-current={ariaCurrent}
            href={item.href}
            className={cn(item.active ? activatedClass : deactivatedClass, shardClass, "cursor-pointer")}
            onClick={() => {
                setIsOpen!(false);
                item.onClick?.();

                if (item.active) {
                    setTimeout(() => {
                        setIsLoadingRef.current(false);
                    }, 0);
                }
            }}
        >
            <h3 className="py-2 text-base">{item.name}</h3>
        </a>
    );
}

function NavLinkItem({ item, activatedClass, deactivatedClass, shardClass, setDropdownMenuOpenedRef }: IHeaderNavItemProps): JSX.Element {
    const { setIsLoadingRef } = usePageHeader();
    const ariaCurrent = item.active ? "page" : undefined;

    return (
        <NavigationMenu.Item hidden={item.hidden}>
            <NavigationMenu.Link
                data-active={item.active ? true : null}
                aria-current={ariaCurrent}
                href={item.href}
                className={cn(NavigationMenu.TriggerStyle(), item.active ? activatedClass : deactivatedClass, shardClass, "cursor-pointer")}
                onClick={() => {
                    setDropdownMenuOpenedRef?.current(false);
                    item.onClick?.();
                    if (item.active) {
                        setTimeout(() => {
                            setIsLoadingRef.current(false);
                        }, 0);
                    }
                }}
            >
                {item.name}
            </NavigationMenu.Link>
        </NavigationMenu.Item>
    );
}

export default HedaerNavItems;

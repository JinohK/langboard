import { useTranslation } from "react-i18next";
import { THeaderNavItemsProps } from "@/components/Header/types";
import { Accordion, DropdownMenu, NavigationMenu } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { makeReactKey } from "@/core/utils/StringUtils";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";

function NavItems({ isMobile, navs, setIsOpen, activatedClass, deactivatedClass, shardClass }: THeaderNavItemsProps): JSX.Element[] {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();

    return navs.map((item) => {
        let itemComponent;
        const key = makeReactKey(item.name);
        if (item.subNavs) {
            const subProps: THeaderNavItemsProps = {
                isMobile: isMobile as false,
                navs: item.subNavs,
                setIsOpen,
                activatedClass,
                deactivatedClass,
                shardClass,
            };

            if (isMobile) {
                subProps.shardClass = `${subProps.shardClass} py-2`;
                itemComponent = (
                    <Accordion.Root type="single" collapsible key={key}>
                        <Accordion.Item value={key} className="border-b-0">
                            <Accordion.Trigger
                                className={cn("py-2", item.active ? activatedClass : deactivatedClass, shardClass)}
                                disabled={subProps.navs.length === 0}
                                hidden={item.hidden}
                            >
                                {t(item.name)}
                            </Accordion.Trigger>
                            <Accordion.Content className="pb-0 pl-4 pt-2">
                                <NavItems {...subProps} />
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>
                );
            } else {
                subProps.shardClass = `${subProps.shardClass} w-full justify-stretch`;
                itemComponent = (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <NavigationMenu.Trigger
                                data-active={item.active ? true : null}
                                disabled={subProps.navs.length === 0}
                                hidden={item.hidden}
                            >
                                {t(item.name)}
                            </NavigationMenu.Trigger>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <ul className="max-h-80 overflow-y-auto">
                                <NavItems {...subProps} />
                            </ul>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                );
            }
        } else {
            const navProps = {
                href: item.href,
                className: cn(
                    isMobile ? "" : NavigationMenu.TriggerStyle(),
                    item.active ? activatedClass : deactivatedClass,
                    shardClass,
                    "cursor-pointer"
                ),
            };

            const ariaCurrent = item.active ? "page" : undefined;

            if (isMobile) {
                itemComponent = (
                    <a
                        aria-current={ariaCurrent}
                        key={item.name}
                        onClick={() => {
                            setIsOpen(false);
                            item.onClick?.();

                            if (item.active) {
                                setTimeout(() => {
                                    setIsLoadingRef.current(false);
                                }, 0);
                            }
                        }}
                        {...navProps}
                    >
                        <h3 className="py-2 text-base">{t(item.name)}</h3>
                    </a>
                );
            } else {
                itemComponent = (
                    <NavigationMenu.Link
                        data-active={item.active ? true : null}
                        aria-current={ariaCurrent}
                        onClick={() => {
                            item.onClick?.();
                            if (item.active) {
                                setTimeout(() => {
                                    setIsLoadingRef.current(false);
                                }, 0);
                            }
                        }}
                        {...navProps}
                    >
                        {t(item.name)}
                    </NavigationMenu.Link>
                );
            }
        }

        return isMobile ? (
            itemComponent
        ) : (
            <NavigationMenu.Item key={key} hidden={item.hidden}>
                {itemComponent}
            </NavigationMenu.Item>
        );
    });
}

export default NavItems;

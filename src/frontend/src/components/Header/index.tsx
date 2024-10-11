/* eslint-disable @/max-len */
import { Menu } from "lucide-react";
import { Accordion, Avatar, Button, DropdownMenu, NavigationMenu, Sheet } from "@/components/base";
import { classNames, cn } from "@/core/utils/ComponentUtils";
import { useAuth } from "@/core/providers/AuthProvider";
import { useEffect, useState } from "react";

export interface IHeaderNavItem {
    name: string;
    subNavs?: Omit<IHeaderNavItem, "subNavs">[];
    href?: string;
    click?: () => void;
    active?: true;
}

export interface IHeaderProps {
    navs: IHeaderNavItem[];
}

interface IBaseNavItemProps {
    isMobile?: boolean;
    navs: IHeaderProps["navs"];
    activatedClass?: string;
    deactivatedClass?: string;
    shardClass?: string;
}

interface IMobileNavItemProps extends IBaseNavItemProps {
    isMobile: true;
    activatedClass: string;
    deactivatedClass: string;
    shardClass: string;
}

interface IDesktopNavItemProps extends IBaseNavItemProps {
    isMobile?: false;
}

type TNavItemProps = IMobileNavItemProps | IDesktopNavItemProps;

function NavItems({ isMobile, navs, activatedClass, deactivatedClass, shardClass }: TNavItemProps): JSX.Element[] {
    return navs.map((item) => {
        let content;
        if (item.subNavs) {
            const subProps: TNavItemProps = {
                isMobile: isMobile as false,
                navs: item.subNavs,
                activatedClass,
                deactivatedClass,
                shardClass,
            };

            if (isMobile) {
                subProps.shardClass = `${subProps.shardClass} py-2`;
                content = (
                    <Accordion.Root type="single" collapsible key={item.name}>
                        <Accordion.Item value={item.name} className="border-b-0">
                            <Accordion.Trigger
                                className={classNames(
                                    "py-2",
                                    item.active ? activatedClass : deactivatedClass,
                                    shardClass
                                )}
                            >
                                {item.name}
                            </Accordion.Trigger>
                            <Accordion.Content className="pb-0 pl-4 pt-2">
                                <NavItems {...subProps} />
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>
                );
            } else {
                subProps.shardClass = `${subProps.shardClass} w-full justify-stretch`;
                content = (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <NavigationMenu.Trigger>{item.name}</NavigationMenu.Trigger>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <ul>
                                <NavItems {...subProps} />
                            </ul>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                );
            }
        } else {
            const navProps = {
                href: item.href,
                onClick: item.click,
                className: cn(
                    isMobile ? "" : NavigationMenu.TriggerStyle(),
                    item.active ? activatedClass : deactivatedClass,
                    shardClass,
                    "cursor-pointer"
                ),
            };

            const ariaCurrent = item.active ? "page" : undefined;

            if (isMobile) {
                content = (
                    <a aria-current={ariaCurrent} key={item.name} {...navProps}>
                        <h3 className="py-2 text-base">{item.name}</h3>
                    </a>
                );
            } else {
                content = (
                    <NavigationMenu.Link aria-current={ariaCurrent} {...navProps}>
                        {item.name}
                    </NavigationMenu.Link>
                );
            }
        }

        return isMobile ? content : <NavigationMenu.Item key={item.name}>{content}</NavigationMenu.Item>;
    });
}

function Header({ navs }: IHeaderProps) {
    const { aboutMe, logout } = useAuth();
    const [userInitial, setUserInitial] = useState<string | null>(null);

    useEffect(() => {
        const getUserInitial = async () => {
            try {
                const user = await aboutMe();
                if (user.name.includes(" ")) {
                    const names = user.name.split(" ");
                    setUserInitial(`${names[0].charAt(0)}${names.pop()!.charAt(0)}`);
                    return;
                }

                setUserInitial(user.name.charAt(0));
            } catch {
                return;
            }
        };

        getUserInitial();
    }, []);

    return (
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <a href="/" className="flex h-6 w-6 items-center gap-2 text-lg font-semibold md:text-base">
                    <img src="/images/logo.png" alt="Logo" className="h-full w-full" />
                </a>
                <NavigationMenu.Root>
                    <NavigationMenu.List>
                        <NavItems navs={navs} />
                    </NavigationMenu.List>
                </NavigationMenu.Root>
            </div>
            <Sheet.Root>
                <Sheet.Title hidden />
                <Sheet.Description hidden />
                <Sheet.Trigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </Sheet.Trigger>
                <Sheet.Content side="left">
                    <nav className="grid gap-4 text-lg font-medium">
                        <a href="/" className="flex items-center gap-2 text-lg font-semibold">
                            <img src="/images/logo.png" alt="Logo" className="h-6 w-6" />
                        </a>
                        <NavItems
                            isMobile
                            navs={navs}
                            activatedClass=""
                            deactivatedClass="text-muted-foreground"
                            shardClass="hover:text-foreground"
                        />
                    </nav>
                </Sheet.Content>
            </Sheet.Root>
            <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Avatar.Root>
                                <Avatar.Fallback>{userInitial}</Avatar.Fallback>
                            </Avatar.Root>
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Label>My Account</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>Settings</DropdownMenu.Item>
                        <DropdownMenu.Item>Support</DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>
                            <a onClick={() => logout()}>Logout</a>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
        </header>
    );
}

export default Header;

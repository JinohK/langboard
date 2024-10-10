/* eslint-disable @/max-len */
import { CircleUser, Menu } from "lucide-react";
import { Button, DropdownMenu, Sheet } from "@/components/base";
import { classNames } from "@/core/utils/ComponentUtils";

export interface IHeaderNavItem {
    name: string;
    href?: string;
    click?: () => void;
    active?: true;
}

export interface IHeaderProps {
    navs: IHeaderNavItem[];
}

const createNavItems = (
    navs: IHeaderNavItem[],
    activatedClass: string,
    deactivatedClass: string,
    shardClass: string
): JSX.Element[] =>
    navs.map((item) => (
        <a
            key={item.name}
            href={item.href}
            onClick={item.click}
            aria-current={item.active ? "page" : undefined}
            className={classNames(item.active ? activatedClass : deactivatedClass, shardClass)}
        >
            {item.name}
        </a>
    ));

function Header({ navs }: IHeaderProps) {
    return (
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <a href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <img src="/images/logo.png" alt="Logo" className="h-6 w-6" />
                </a>
                {createNavItems(
                    navs,
                    "text-foreground",
                    "text-muted-foreground",
                    "transition-colors hover:text-foreground"
                )}
            </nav>
            <Sheet.Root>
                <Sheet.Trigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </Sheet.Trigger>
                <Sheet.Content side="left">
                    <nav className="grid gap-6 text-lg font-medium">
                        <a href="/" className="flex items-center gap-2 text-lg font-semibold">
                            <img src="/images/logo.png" alt="Logo" className="h-6 w-6" />
                        </a>
                        {createNavItems(navs, "", "text-muted-foreground", "hover:text-foreground")}
                    </nav>
                </Sheet.Content>
            </Sheet.Root>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <CircleUser className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Label>My Account</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>Settings</DropdownMenu.Item>
                        <DropdownMenu.Item>Support</DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>Logout</DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
        </header>
    );
}

export default Header;

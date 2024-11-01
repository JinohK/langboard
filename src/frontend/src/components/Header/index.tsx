import { useNavigate } from "react-router-dom";
import { Button, IconComponent, NavigationMenu, Separator, Sheet } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { useState } from "react";
import { IHeaderProps } from "@/components/Header/types";
import NavItems from "@/components/Header/NavItems";
import { ROUTES } from "@/core/routing/constants";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useTranslation } from "react-i18next";
import UserAvatar from "@/components/UserAvatar";

function Header({ navs }: IHeaderProps) {
    const { isAuthenticated, aboutMe, signOut } = useAuth();
    const [isOpened, setIsOpen] = useState(false);
    const [t] = useTranslation();
    const navigate = useNavigate();

    const toDashboard = () => {
        navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
    };

    const separator = <Separator className="h-5" orientation="vertical" />;

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <a onClick={toDashboard} className="flex size-6 cursor-pointer items-center gap-2 text-lg font-semibold md:text-base">
                    <img src="/images/logo.png" alt="Logo" className="size-full" />
                </a>
                {navs.length > 0 && (
                    <NavigationMenu.Root>
                        <NavigationMenu.List>
                            <NavItems navs={navs} />
                        </NavigationMenu.List>
                    </NavigationMenu.Root>
                )}
            </div>
            {navs.length > 0 && (
                <Sheet.Root open={isOpened} onOpenChange={setIsOpen}>
                    <Sheet.Title hidden />
                    <Sheet.Description hidden />
                    <Sheet.Trigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                            <IconComponent icon="menu" size="5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </Sheet.Trigger>
                    <Sheet.Content side="left">
                        <nav className="grid gap-2 text-lg font-medium">
                            <a onClick={toDashboard} className="mb-4 flex cursor-pointer items-center gap-2 text-lg font-semibold">
                                <img src="/images/logo.png" alt="Logo" className="size-6" />
                            </a>
                            <NavItems
                                isMobile
                                navs={navs}
                                setIsOpen={setIsOpen}
                                activatedClass=""
                                deactivatedClass="text-muted-foreground"
                                shardClass="hover:text-foreground"
                            />
                        </nav>
                    </Sheet.Content>
                </Sheet.Root>
            )}
            <div className="flex w-full items-center justify-end gap-2 md:ml-auto lg:gap-3">
                <LanguageSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {separator}
                <ThemeSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {isAuthenticated() && aboutMe() ? (
                    <>
                        {separator}
                        <UserAvatar.Root
                            user={aboutMe()!}
                            align="end"
                            avatarSize={{
                                initial: "sm",
                                md: "default",
                            }}
                            className="mx-1"
                        >
                            <UserAvatar.List>
                                <UserAvatar.ListItem className="cursor-pointer" onClick={() => navigate(ROUTES.ACCOUNT.PROFILE)}>
                                    {t("myAccount.My Account")}
                                </UserAvatar.ListItem>
                                <UserAvatar.ListSeparator />
                                <UserAvatar.ListItem className="cursor-pointer" onClick={() => signOut()}>
                                    {t("myAccount.Sign out")}
                                </UserAvatar.ListItem>
                                <UserAvatar.ListSeparator />
                            </UserAvatar.List>
                        </UserAvatar.Root>
                    </>
                ) : null}
            </div>
        </header>
    );
}

export default Header;

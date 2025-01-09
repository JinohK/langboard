import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CachedImage from "@/components/CachedImage";
import HedaerNavItems from "@/components/Header/HedaerNavItems";
import { IHeaderProps } from "@/components/Header/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import UserAvatar from "@/components/UserAvatar";
import { Button, Flex, IconComponent, NavigationMenu, Separator, Sheet } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { useSocket } from "@/core/providers/SocketProvider";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { AuthUser } from "@/core/models";
import { NavigateFunction } from "react-router-dom";

function Header({ navs }: IHeaderProps) {
    const { aboutMe, signOut, updated } = useAuth();
    const [isOpened, setIsOpen] = useState(false);
    const navigate = useRef(usePageNavigate());
    const [currentUser, setCurrentUser] = useState(aboutMe());

    useEffect(() => {
        setCurrentUser(aboutMe());
    }, [updated]);

    const toDashboard = () => {
        navigate.current(ROUTES.DASHBOARD.PROJECTS.ALL);
    };

    const separator = <Separator className="h-5" orientation="vertical" />;

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <Flex
                items="center"
                gap={{
                    initial: "6",
                    md: "5",
                    lg: "6",
                }}
                textSize={{
                    initial: "lg",
                    md: "sm",
                }}
                weight="medium"
                className="hidden md:flex"
            >
                <a onClick={toDashboard} className="flex size-6 cursor-pointer items-center gap-2 text-lg font-semibold md:text-base">
                    <CachedImage src="/images/logo.png" alt="Logo" size="full" />
                </a>
                {navs.length > 0 && (
                    <NavigationMenu.Root>
                        <NavigationMenu.List>
                            <HedaerNavItems navs={navs} />
                        </NavigationMenu.List>
                    </NavigationMenu.Root>
                )}
            </Flex>
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
                                <CachedImage src="/images/logo.png" alt="Logo" size="6" />
                            </a>
                            <HedaerNavItems
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
            <Flex
                items="center"
                justify="end"
                gap={{
                    initial: "2",
                    md: "3",
                }}
                w="full"
                ml={{
                    md: "auto",
                }}
            >
                <LanguageSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {separator}
                <ThemeSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {currentUser ? (
                    <>
                        {separator}
                        <HeaderUserMenu currentUser={currentUser} signOut={signOut} navigate={navigate} />
                    </>
                ) : null}
            </Flex>
        </header>
    );
}

interface IHeaderUserMenuProps {
    currentUser: AuthUser.TModel;
    signOut: () => void;
    navigate: React.RefObject<NavigateFunction>;
}

const HeaderUserMenu = memo(({ currentUser, signOut, navigate }: IHeaderUserMenuProps) => {
    const [t] = useTranslation();
    const { close: closeSocket } = useSocket();
    const isAdmin = currentUser.useField("is_admin");

    return (
        <UserAvatar.Root
            user={currentUser}
            listAlign="end"
            avatarSize={{
                initial: "sm",
                md: "default",
            }}
            className="mx-1"
        >
            <UserAvatar.List>
                <UserAvatar.ListItem className="cursor-pointer" onClick={() => navigate.current(ROUTES.ACCOUNT.PROFILE)}>
                    {t("myAccount.My account")}
                </UserAvatar.ListItem>
                {isAdmin && (
                    <>
                        <UserAvatar.ListSeparator />
                        <UserAvatar.ListItem className="cursor-pointer" onClick={() => navigate.current(ROUTES.SETTINGS.ROUTE)}>
                            {t("settings.App settings")}
                        </UserAvatar.ListItem>
                    </>
                )}
                <UserAvatar.ListSeparator />
                <UserAvatar.ListItem
                    className="cursor-pointer"
                    onClick={() => {
                        closeSocket();
                        signOut();
                    }}
                >
                    {t("myAccount.Sign out")}
                </UserAvatar.ListItem>
                <UserAvatar.ListSeparator />
            </UserAvatar.List>
        </UserAvatar.Root>
    );
});

export default Header;

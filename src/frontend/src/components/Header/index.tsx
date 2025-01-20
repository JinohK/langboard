import { useEffect, useRef, useState } from "react";
import CachedImage from "@/components/CachedImage";
import HedaerNavItems from "@/components/Header/HedaerNavItems";
import { IHeaderProps } from "@/components/Header/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button, Flex, IconComponent, NavigationMenu, Separator, Sheet } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import HeaderUserMenu from "@/components/Header/HeaderUserMenu";
import HeaderUserNotification from "@/components/Header/HeaderUserNotification";

function Header({ navs }: IHeaderProps) {
    const { aboutMe, updated } = useAuth();
    const [isOpened, setIsOpen] = useState(false);
    const navigateRef = useRef(usePageNavigate());
    const [currentUser, setCurrentUser] = useState(aboutMe());

    useEffect(() => {
        setCurrentUser(aboutMe());
    }, [updated]);

    const toDashboard = () => {
        navigateRef.current(ROUTES.DASHBOARD.PROJECTS.ALL);
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
                        <HeaderUserNotification currentUser={currentUser} navigateRef={navigateRef} />
                        {separator}
                        <HeaderUserMenu currentUser={currentUser} navigateRef={navigateRef} />
                    </>
                ) : null}
            </Flex>
        </header>
    );
}

export default Header;

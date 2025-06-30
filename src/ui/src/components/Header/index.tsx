import { useState } from "react";
import CachedImage from "@/components/CachedImage";
import HedaerNavItems from "@/components/Header/HedaerNavItems";
import { IHeaderProps } from "@/components/Header/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button, Flex, IconComponent, NavigationMenu, Separator, Sheet } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import HeaderUserMenu from "@/components/Header/HeaderUserMenu";
import HeaderUserNotification from "@/components/Header/HeaderUserNotification";
import UserPreferenceLanguageSwitcher from "@/components/LanguageSwitcher/UserPreference";

function Header({ navs, title }: IHeaderProps) {
    const { currentUser } = useAuth();
    const [isOpened, setIsOpen] = useState(false);
    const navigate = usePageNavigateRef();

    const toDashboard = () => {
        navigate(ROUTES.DASHBOARD.PROJECTS.ALL, { smooth: true });
    };

    const separator = <Separator className="h-5" orientation="vertical" />;

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            {!navs.length && (
                <Flex className="flex md:hidden">
                    <a onClick={toDashboard} className="flex size-6 cursor-pointer items-center gap-2 text-lg font-semibold md:text-base">
                        <CachedImage src="/images/logo.png" alt="Logo" size="full" />
                    </a>
                </Flex>
            )}
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
                {!!title && <span className="text-lg font-semibold">{title}</span>}
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
                    <Sheet.Content side="left" className="flex flex-col justify-between">
                        <Flex
                            items="center"
                            position="absolute"
                            left="6"
                            top="6"
                            gap="2"
                            w="full"
                            className="max-w-[calc(100%_-_theme(spacing.16))] truncate sm:max-w-[calc(24rem_-_theme(spacing.16))]"
                        >
                            <a onClick={toDashboard} className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
                                <CachedImage src="/images/logo.png" alt="Logo" size="6" />
                            </a>
                            {!!title && (
                                <>
                                    <IconComponent icon="chevron-right" size="5" />
                                    <span className="max-w-[calc(100%_-_theme(spacing.16))] truncate text-lg font-semibold">{title}</span>
                                </>
                            )}
                        </Flex>
                        <nav className="mt-9 grid gap-2 overflow-y-auto text-lg font-medium">
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
                ml={{
                    md: "auto",
                }}
            >
                {currentUser ? (
                    <UserPreferenceLanguageSwitcher currentUser={currentUser} variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                ) : (
                    <LanguageSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                )}
                {separator}
                <ThemeSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {currentUser ? (
                    <>
                        {separator}
                        <HeaderUserNotification currentUser={currentUser} />
                        {separator}
                        <HeaderUserMenu currentUser={currentUser} />
                    </>
                ) : null}
            </Flex>
        </header>
    );
}

export default Header;

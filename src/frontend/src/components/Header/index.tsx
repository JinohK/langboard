/* eslint-disable @/max-len */
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, DropdownMenu, NavigationMenu, Separator, Sheet } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { useEffect, useState } from "react";
import { API_URL } from "@/constants";
import { IHeaderProps } from "@/components/Header/types";
import NavItems from "@/components/Header/NavItems";
import { ROUTES } from "@/core/routing/constants";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useTranslation } from "react-i18next";

function Header({ navs }: IHeaderProps) {
    const { isAuthenticated, aboutMe, signOut } = useAuth();
    const [userInitial, setUserInitial] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isOpened, setIsOpen] = useState(false);
    const [t] = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        const getUserInfo = async () => {
            if (!isAuthenticated()) {
                return;
            }

            try {
                const user = await aboutMe();
                if (user.name.includes(" ")) {
                    const names = user.name.split(" ");
                    setUserInitial(`${names[0].charAt(0)}${names.pop()!.charAt(0)}`);
                } else {
                    setUserInitial(user.name.charAt(0));
                }

                if (user.avatar) {
                    setAvatar(user.avatar);
                }
            } catch {
                return;
            }
        };

        getUserInfo();
    }, []);

    const toDashboard = () => {
        navigate(ROUTES.DASHBOARD);
    };

    const separator = <Separator className="h-5" orientation="vertical" />;

    return (
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <a
                    onClick={toDashboard}
                    className="flex h-6 w-6 cursor-pointer items-center gap-2 text-lg font-semibold md:text-base"
                >
                    <img src="/images/logo.png" alt="Logo" className="h-full w-full" />
                </a>
                <NavigationMenu.Root>
                    <NavigationMenu.List>
                        <NavItems navs={navs} />
                    </NavigationMenu.List>
                </NavigationMenu.Root>
            </div>
            <Sheet.Root open={isOpened} onOpenChange={setIsOpen}>
                <Sheet.Title hidden />
                <Sheet.Description hidden />
                <Sheet.Trigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </Sheet.Trigger>
                <Sheet.Content side="left">
                    <nav className="grid gap-2 text-lg font-medium">
                        <a
                            onClick={toDashboard}
                            className="mb-4 flex cursor-pointer items-center gap-2 text-lg font-semibold"
                        >
                            <img src="/images/logo.png" alt="Logo" className="h-6 w-6" />
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
            <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-3">
                <LanguageSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {separator}
                <ThemeSwitcher variant="ghost" hideTriggerIcon buttonClassNames="p-2" />
                {isAuthenticated() ? (
                    <>
                        {separator}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full"
                                    title={t("myAccount.My Account")}
                                >
                                    <Avatar.Root>
                                        <Avatar.Image src={`${API_URL}${avatar}`} />
                                        <Avatar.Fallback>{userInitial}</Avatar.Fallback>
                                    </Avatar.Root>
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
                                <DropdownMenu.Label>{t("myAccount.My Account")}</DropdownMenu.Label>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item className="cursor-pointer">
                                    <a onClick={() => navigate(ROUTES.SETTINGS)}>{t("myAccount.Settings")}</a>
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item className="cursor-pointer">
                                    <a onClick={() => signOut()}>{t("myAccount.Sign out")}</a>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </>
                ) : null}
            </div>
        </header>
    );
}

export default Header;

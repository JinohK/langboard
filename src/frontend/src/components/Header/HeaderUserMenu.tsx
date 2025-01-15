import { memo } from "react";
import { useTranslation } from "react-i18next";
import UserAvatar from "@/components/UserAvatar";
import { ROUTES } from "@/core/routing/constants";
import { useSocket } from "@/core/providers/SocketProvider";
import { AuthUser } from "@/core/models";
import { NavigateFunction } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";

interface IHeaderUserMenuProps {
    currentUser: AuthUser.TModel;
    navigate: React.RefObject<NavigateFunction>;
}

const HeaderUserMenu = memo(({ currentUser, navigate }: IHeaderUserMenuProps) => {
    const { signOut } = useAuth();
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

export default HeaderUserMenu;

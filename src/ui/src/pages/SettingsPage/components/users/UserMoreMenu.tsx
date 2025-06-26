import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useDeleteUserInSettings from "@/controllers/api/settings/users/useDeleteUserInSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ISettingsUserContext } from "@/pages/SettingsPage/components/users/types";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const UserMoreMenu = memo(() => {
    return (
        <MoreMenu.Root
            triggerProps={{ className: "size-7", titleSide: "bottom", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
            contentProps={{ className: "w-min p-0", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
        >
            <UserMoreMenuDelete />
        </MoreMenu.Root>
    );
});

const UserMoreMenuDelete = memo(() => {
    const { model: user, params } = ModelRegistry.User.useContext<ISettingsUserContext>();
    const { virtualizerRef } = params;
    const [t] = useTranslation();
    const { mutateAsync } = useDeleteUserInSettings(user, { interceptToast: true });

    const deleteUser = (endCallback: (shouldClose: bool) => void) => {
        const promise = mutateAsync({});

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.User deleted successfully.");
            },
            finally: () => {
                virtualizerRef.current?.measure();
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem
            modal
            contentProps={{ align: "center", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
            menuName={t("settings.Delete user")}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteUser}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                {t("ask.Are you sure you want to delete this user?")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("common.deleteDescriptions.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
});

export default UserMoreMenu;

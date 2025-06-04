import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useDeleteProjectChatTemplate from "@/controllers/api/board/chat/useDeleteProjectChatTemplate";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useTranslation } from "react-i18next";

function BoardSettingsChatTemplateMoreMenuDelete(): JSX.Element {
    const { project } = useBoardSettings();
    const { model: chatTemplate } = ModelRegistry.ChatTemplateModel.useContext();
    const [t] = useTranslation();
    const { mutateAsync: deleteProjectChatTemplateMutateAsync } = useDeleteProjectChatTemplate();

    const deleteAttachment = (endCallback: (shouldClose: bool) => void) => {
        const promise = deleteProjectChatTemplateMutateAsync({
            project_uid: project.uid,
            template_uid: chatTemplate.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Chat template deleted successfully.");
            },
            finally: () => {
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem
            modal
            menuName={t("common.Delete")}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteAttachment}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold">
                {t("project.settings.Are you sure you want to delete this template?")}
            </Box>
            <Box textSize="sm" weight="bold" className="text-center text-red-500">
                {t("project.settings.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
}

export default BoardSettingsChatTemplateMoreMenuDelete;

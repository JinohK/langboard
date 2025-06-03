import { Box, Button, DropdownMenu, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteProjectChatTemplate from "@/controllers/api/board/chat/useDeleteProjectChatTemplate";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { IBoardSettingsChatTemplateRelatedProps } from "@/pages/BoardPage/components/settings/chat/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsChatTemplateMoreDeleteProps extends IBoardSettingsChatTemplateRelatedProps {}

function BoardSettingsChatTemplateMoreDelete({ chatTemplate, setIsMoreMenuOpened }: IBoardSettingsChatTemplateMoreDeleteProps): JSX.Element {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: deleteProjectChatTemplateMutateAsync } = useDeleteProjectChatTemplate();

    const deleteAttachment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteProjectChatTemplateMutateAsync({
            project_uid: project.uid,
            template_uid: chatTemplate.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Chat template deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
                setIsMoreMenuOpened(false);
            },
        });
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpened(true);
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item onClick={handleClick}>{t("common.Delete")}</DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold">
                    {t("project.settings.Are you sure you want to delete this template?")}
                </Box>
                <Box textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.settings.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteAttachment} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardSettingsChatTemplateMoreDelete;

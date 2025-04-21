import { Box, Button, DropdownMenu, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteProjectLabel from "@/controllers/api/board/settings/useDeleteProjectLabel";
import { useBoardSettingsLabel } from "@/core/providers/BoardSettingsLabelProvider";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { IBoardSettingsLabelRelatedProps } from "@/pages/BoardPage/components/settings/label/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsLabelMoreDeleteProps extends IBoardSettingsLabelRelatedProps {}

function BoardSettingsLabelMoreDelete({ setIsMoreMenuOpened }: IBoardSettingsLabelMoreDeleteProps): JSX.Element {
    const { project } = useBoardSettings();
    const { label, isValidating, setIsValidating, sharedErrorHandler } = useBoardSettingsLabel();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: deleteProjectLabelMutateAsync } = useDeleteProjectLabel();

    const deleteAttachment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteProjectLabelMutateAsync({
            project_uid: project.uid,
            label_uid: label.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: sharedErrorHandler,
            success: () => {
                return t("project.settings.successes.Label deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
            },
        });
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpened(true);
                    }}
                >
                    {t("common.Delete")}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold">
                    {t("project.settings.Are you sure you want to delete this label?")}
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

export default BoardSettingsLabelMoreDelete;

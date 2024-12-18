import { Box, Button, DropdownMenu, Flex, Popover, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import useDeleteCardAttachment from "@/controllers/api/card/attachment/useDeleteCardAttachment";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { IBaseBoardCardAttachmentMoreProps } from "@/pages/BoardPage/components/card/attachment/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardAttachmentMoreDeleteProps extends IBaseBoardCardAttachmentMoreProps {
    deletedAttachment: (uid: string) => void;
    sharedErrorHandler: (error: unknown) => string;
}

function BoardCardAttachmentMoreDelete({
    attachment,
    isValidating,
    setIsValidating,
    setIsMoreMenuOpened,
    deletedAttachment,
    sharedErrorHandler,
}: IBoardCardAttachmentMoreDeleteProps): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: deleteCardAttachmentMutateAsync } = useDeleteCardAttachment();

    const deleteAttachment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteCardAttachmentMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            attachment_uid: attachment.uid,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: sharedErrorHandler,
            success: () => {
                deletedAttachment(attachment.uid);
                return t("card.File deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpened}>
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
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold">
                    {t("card.Are you sure you want to delete this file?")}
                </Box>
                <Box textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("card.This action cannot be undone.")}
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

export default BoardCardAttachmentMoreDelete;

import { Box, Button, DropdownMenu, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteCardChecklist from "@/controllers/api/card/checklist/useDeleteCardChecklist";
import { useBoardCardChecklist } from "@/core/providers/BoardCardChecklistProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardChecklistMoreDelete({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checklist, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardChecklist();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: deleteChecklistMutateAsync } = useDeleteCardChecklist();

    const deleteChecklist = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteChecklistMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Checklist deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
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
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("card.Are you sure you want to delete this checklist?")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("card.All checkitems in this group will be deleted as well.")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("card.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteChecklist} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardCardChecklistMoreDelete;

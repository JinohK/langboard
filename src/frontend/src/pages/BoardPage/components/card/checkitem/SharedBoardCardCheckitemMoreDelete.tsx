import { Button, DropdownMenu, Flex, Popover, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import useDeleteCheckitem from "@/controllers/api/card/checkitem/useDeleteCheckitem";
import { IBoardCardSubCheckitem } from "@/controllers/api/card/useGetCardDetails";
import useCardCheckitemDeletedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemDeletedHandlers";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemMoreDelete({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, socket, sharedClassNames } = useBoardCard();
    const { checkitem, isParent, isValidating, setIsValidating, sharedErrorHandler, deleted } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: deleteCheckitemMutateAsync } = useDeleteCheckitem();
    const { send: sendCheckitemDeleted } = useCardCheckitemDeletedHandlers({ socket });

    const deleteCheckitem = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: sharedErrorHandler,
            success: () => {
                deleted(checkitem.uid);
                sendCheckitemDeleted({
                    parent_uid: isParent ? card.uid : (checkitem as IBoardCardSubCheckitem).checkitem_uid,
                    checkitem_uid: checkitem.uid,
                });
                return t("card.Checkitem deleted successfully.");
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
            <Popover.Content className={sharedClassNames.morePopover} align="end">
                <div className="mb-1 text-center text-sm font-semibold sm:text-base">{t("card.Are you sure you want to delete this checkitem?")}</div>
                {isParent && (
                    <div className="max-w-full text-center text-sm font-bold text-red-500">
                        {t("card.All sub-checkitems will be deleted as well.")}
                    </div>
                )}
                <div className="max-w-full text-center text-sm font-bold text-red-500">{t("card.This action cannot be undone.")}</div>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteCheckitem} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default SharedBoardCardCheckitemMoreDelete;

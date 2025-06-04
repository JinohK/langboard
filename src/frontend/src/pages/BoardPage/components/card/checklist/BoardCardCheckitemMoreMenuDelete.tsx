import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import useDeleteCardCheckitem from "@/controllers/api/card/checkitem/useDeleteCardCheckitem";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemMoreDelete(): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { model: checkitem } = ModelRegistry.ProjectCheckitem.useContext();
    const [t] = useTranslation();
    const { mutateAsync: deleteCheckitemMutateAsync } = useDeleteCardCheckitem();

    const deleteCheckitem = (endCallback: (shouldClose: bool) => void) => {
        const promise = deleteCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
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
                return t("card.successes.Checkitem deleted successfully.");
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
            contentProps={{ className: sharedClassNames.popoverContent }}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteCheckitem}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                {t("card.Are you sure you want to delete this checkitem?")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("card.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
}

export default BoardCardCheckitemMoreDelete;

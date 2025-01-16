import { Button, IconComponent, Toast } from "@/components/base";
import useCreateCardCheckitem from "@/controllers/api/card/checkitem/useCreateCardCheckitem";
import { useBoardCardChecklist } from "@/core/providers/BoardCardChecklistProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardChecklistAddItem(): JSX.Element {
    const { projectUID, card } = useBoardCard();
    const { checklist, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardChecklist();
    const [t] = useTranslation();
    const { mutateAsync: createCheckitemMutateAsync } = useCreateCardCheckitem();

    const createCheckitem = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = createCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
            title: "New checkitem",
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Creating..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Checkitem added successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden h-8 w-5 sm:inline-flex sm:size-8"
            title={t("card.Add checkitem")}
            onClick={() => createCheckitem()}
        >
            <IconComponent icon="plus" size="4" />
        </Button>
    );
}

export default BoardCardChecklistAddItem;

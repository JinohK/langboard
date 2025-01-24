import { Checkbox, Toast } from "@/components/base";
import useToggleCardChecklistChecked from "@/controllers/api/card/checklist/useToggleCardChecklistChecked";
import { useBoardCardChecklist } from "@/core/providers/BoardCardChecklistProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardChecklistCheckbox() {
    const { projectUID, card } = useBoardCard();
    const { checklist, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardChecklist();
    const [t] = useTranslation();
    const isChecked = checklist.useField("is_checked");
    const { mutateAsync: toggleChecklistMutateAsync } = useToggleCardChecklistChecked();

    const toggleChecked = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = toggleChecklistMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Toggled checklist successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return <Checkbox checked={isChecked} onClick={toggleChecked} disabled={isValidating} />;
}

export default BoardCardChecklistCheckbox;

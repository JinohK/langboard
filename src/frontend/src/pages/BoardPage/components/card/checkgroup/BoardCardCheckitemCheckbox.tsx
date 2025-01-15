import { Checkbox, Toast } from "@/components/base";
import useToggleCardCheckitemChecked from "@/controllers/api/card/checkitem/useToggleCardCheckitemChecked";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardCheckitemCheckbox() {
    const { projectUID, card } = useBoardCard();
    const { checkitem, isValidating, canEditCheckitem, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const isChecked = checkitem.useField("is_checked");
    const { mutateAsync: toggleCheckitemMutateAsync } = useToggleCardCheckitemChecked();

    const toggleChecked = () => {
        if (isValidating || !canEditCheckitem) {
            return;
        }

        setIsValidating(true);

        const promise = toggleCheckitemMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Toggled checkitem successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return <Checkbox checked={isChecked} onClick={toggleChecked} disabled={isValidating || !canEditCheckitem} />;
}

export default BoardCardCheckitemCheckbox;

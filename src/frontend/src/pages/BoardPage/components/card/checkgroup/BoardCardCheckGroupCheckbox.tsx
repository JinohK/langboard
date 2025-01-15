import { Checkbox, Toast } from "@/components/base";
import useToggleCardCheckGroupChecked from "@/controllers/api/card/checkgroup/useToggleCardCheckGroupChecked";
import { useBoardCardCheckGroup } from "@/core/providers/BoardCardCheckGroupProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardCheckGroupCheckbox() {
    const { projectUID, card } = useBoardCard();
    const { checkGroup, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckGroup();
    const [t] = useTranslation();
    const isChecked = checkGroup.useField("is_checked");
    const { mutateAsync: toggleCheckGroupMutateAsync } = useToggleCardCheckGroupChecked();

    const toggleChecked = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = toggleCheckGroupMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            check_group_uid: checkGroup.uid,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Toggled check group successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return <Checkbox checked={isChecked} onClick={toggleChecked} disabled={isValidating} />;
}

export default BoardCardCheckGroupCheckbox;

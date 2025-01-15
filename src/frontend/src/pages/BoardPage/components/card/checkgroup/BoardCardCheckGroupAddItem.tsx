import { Button, IconComponent, Toast } from "@/components/base";
import useCreateCardCheckitem from "@/controllers/api/card/checkitem/useCreateCardCheckitem";
import { useBoardCardCheckGroup } from "@/core/providers/BoardCardCheckGroupProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useTranslation } from "react-i18next";

function BoardCardCheckGroupAddItem(): JSX.Element {
    const { projectUID, card } = useBoardCard();
    const { checkGroup, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckGroup();
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
            check_group_uid: checkGroup.uid,
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

export default BoardCardCheckGroupAddItem;

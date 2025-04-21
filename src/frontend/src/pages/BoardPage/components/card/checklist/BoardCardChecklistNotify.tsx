import { Toast } from "@/components/base";
import { MultiSelectAssigneesPopover, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import useNotifyCardChecklist from "@/controllers/api/card/checklist/useNotifyCardChecklist";
import { Project, User, UserGroup } from "@/core/models";
import { useBoardCardChecklist } from "@/core/providers/BoardCardChecklistProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useTranslation } from "react-i18next";

function BoardCardChecklistNotify() {
    const { projectUID, card, currentUser, sharedClassNames, hasRoleAction } = useBoardCard();
    const { checklist, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardChecklist();
    const { mutateAsync: notifyChecklistMutateAsync } = useNotifyCardChecklist();
    const [t] = useTranslation();
    const canEdit = hasRoleAction(Project.ERoleAction.CardUpdate);
    const projectMembers = card.useForeignField<User.TModel>("project_members");
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");

    const notify = (selectedItems: TMultiSelectAssigneeItem[], endCallback: () => void) => {
        if (isValidating || !selectedItems.length) {
            return;
        }

        setIsValidating(true);

        endCallback();
        const promise = notifyChecklistMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checklist_uid: checklist.uid,
            user_uids: selectedItems.map((item) => item.uid),
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: sharedErrorHandler,
            success: () => {
                return t("card.successes.Notified members successfully.");
            },
            finally: () => {
                setIsValidating(false);
                endCallback();
            },
        });
    };

    return (
        <MultiSelectAssigneesPopover
            popoverButtonProps={{
                size: "icon",
                className: "h-8 w-5 sm:size-8",
                variant: "ghost",
                title: t("card.Notify members"),
            }}
            popoverContentProps={{
                className: sharedClassNames.popoverContent,
                align: "start",
            }}
            userAvatarListProps={{
                maxVisible: 6,
                size: { initial: "sm", lg: "default" },
                spacing: "none",
                listAlign: "start",
                className: "space-x-1",
            }}
            multiSelectProps={{
                placeholder: t("card.Select members..."),
                className: cn(
                    "max-w-[calc(100vw_-_theme(spacing.20))]",
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]"
                ),
                inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
            }}
            addIcon="bell-plus"
            addIconSize="5"
            saveText={t("card.Notify")}
            onSave={notify}
            isValidating={isValidating}
            allItems={projectMembers.filter((member) => member.uid !== currentUser.uid)}
            groups={groups}
            assignedFilter={() => false}
            initialSelectedItems={[]}
            canEdit={canEdit}
            projectUID={projectUID}
        />
    );
}

export default BoardCardChecklistNotify;

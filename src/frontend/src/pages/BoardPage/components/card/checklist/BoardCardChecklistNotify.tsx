import { Toast } from "@/components/base";
import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";
import useNotifyCardChecklist from "@/controllers/api/card/checklist/useNotifyCardChecklist";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User, UserGroup } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { IBoardCardCheckRelatedContextParams } from "@/pages/BoardPage/components/card/checklist/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

function BoardCardChecklistNotify() {
    const { projectUID, card, currentUser, hasRoleAction } = useBoardCard();
    const { model: checklist, params } = ModelRegistry.ProjectChecklist.useContext<IBoardCardCheckRelatedContextParams>();
    const { isValidating, setIsValidating } = params;
    const { mutateAsync: notifyChecklistMutateAsync } = useNotifyCardChecklist({ interceptToast: true });
    const [t] = useTranslation();
    const canEdit = hasRoleAction(Project.ERoleAction.CardUpdate);
    const projectMembers = card.useForeignField<User.TModel>("project_members");
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");

    const notify = useCallback(
        (selectedItems: User.TModel[]) => {
            if (isValidating || !selectedItems.length) {
                return;
            }

            setIsValidating(true);

            const promise = notifyChecklistMutateAsync({
                project_uid: projectUID,
                card_uid: card.uid,
                checklist_uid: checklist.uid,
                user_uids: selectedItems.map((item) => item.uid),
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
                    return t("card.successes.Notified members successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                },
            });
        },
        [isValidating, setIsValidating]
    );

    return (
        <MultiSelectAssignee.Popover
            popoverButtonProps={{
                size: "icon",
                className: "h-8 w-5 sm:size-8",
                variant: "ghost",
                title: t("card.Notify members"),
            }}
            popoverContentProps={{
                className: cn(
                    "max-w-[calc(100vw_-_theme(spacing.20))]",
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]"
                ),
                align: "start",
            }}
            userAvatarListProps={{
                maxVisible: 6,
                size: { initial: "sm", lg: "default" },
                spacing: "none",
                listAlign: "start",
                className: "space-x-1",
            }}
            placeholder={t("card.Select members...")}
            allSelectables={projectMembers.filter((member) => member.uid !== currentUser.uid)}
            originalAssignees={[]}
            tagContentProps={{
                projectUID,
            }}
            createSearchText={
                ((item: User.TModel) => `${item.uid} ${item.firstname} ${item.lastname} ${item.email}`) as IFormProps["createSearchText"]
            }
            createLabel={((item: User.TModel) => `${item.firstname} ${item.lastname}`.trim()) as IFormProps["createLabel"]}
            addIcon="bell-plus"
            addIconSize="5"
            saveText={t("card.Notify")}
            save={notify as TSaveHandler}
            groups={groups}
            canEdit={canEdit}
        />
    );
}

export default BoardCardChecklistNotify;

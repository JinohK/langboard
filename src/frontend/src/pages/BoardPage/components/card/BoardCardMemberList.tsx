import { MultiSelectAssigneesPopover, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import { Toast } from "@/components/base";
import useUpdateCardAssignedUsers from "@/controllers/api/card/useUpdateCardAssignedUsers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User, UserGroup } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardCardMemberList = memo(() => {
    const { projectUID, card, sharedClassNames, currentUser, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const canEdit = hasRoleAction(Project.ERoleAction.CardUpdate);
    const projectMembers = card.useForeignField<User.TModel>("project_members");
    const members = card.useForeignField<User.TModel>("members");
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateCardAssignedUsersMutateAsync } = useUpdateCardAssignedUsers();

    const onSave = (items: TMultiSelectAssigneeItem[], endCallback: () => void) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = updateCardAssignedUsersMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            assigned_users: User.filterValidUserUIDs(items as User.TModel[]),
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("card.errors.Card not found."),
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("card.successes.Assigned members updated successfully.");
            },
            finally: () => {
                endCallback();
                setIsValidating(false);
            },
        });
    };

    return (
        <MultiSelectAssigneesPopover
            popoverButtonProps={{
                size: "icon",
                className: "size-8 lg:size-10",
                title: t("card.Assign members"),
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
            addIconSize={{ initial: "4", lg: "6" }}
            onSave={onSave}
            isValidating={isValidating}
            allItems={projectMembers}
            groups={groups}
            assignedFilter={(item) => members.includes(item as User.TModel)}
            initialSelectedItems={members}
            canEdit={canEdit}
            projectUID={projectUID}
        />
    );
});

export default BoardCardMemberList;

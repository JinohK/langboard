import { getMultiSelectItemLabel, MultiSelectAssigneesPopover, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import { Toast } from "@/components/base";
import useUpdateProjectAssignedUsers from "@/controllers/api/board/useUpdateProjectAssignedUsers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, Project, User, UserGroup } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardMemberListProps {
    isSelectCardView: bool;
}

const BoardMemberList = memo(({ isSelectCardView }: IBoardMemberListProps) => {
    const [t] = useTranslation();
    const { project, currentUser, hasRoleAction } = useBoard();
    const canEdit = hasRoleAction(Project.ERoleAction.Update);
    const owners = project.useForeignField<User.TModel>("owner");
    const owner = owners[0];
    const members = project.useForeignField<User.TModel>("members");
    const bots = project.useForeignField<BotModel.TModel>("bots");
    const invitedMembers = project.useForeignField<User.TModel>("invited_members");
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");
    const allItems = useMemo(() => [...members, ...bots, ...invitedMembers], [members, bots, invitedMembers]);
    const [isValidating, setIsValidating] = useState(false);
    const isValidatingRef = useRef(isValidating);
    const { mutateAsync: updateProjectAssignedUsersMutateAsync } = useUpdateProjectAssignedUsers();

    const save = (items: TMultiSelectAssigneeItem[], endCallback: () => void) => {
        if (isValidatingRef.current) {
            return;
        }

        setIsValidating(true);
        isValidatingRef.current = true;

        const promise = updateProjectAssignedUsersMutateAsync({
            uid: project.uid,
            emails: (items as User.TModel[]).map((user) => user.email),
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("project.errors.Project not found."),
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.successes.Assigned members updated and invited new users successfully.");
            },
            finally: () => {
                endCallback();
                setIsValidating(false);
                isValidatingRef.current = false;
            },
        });
    };

    return (
        <MultiSelectAssigneesPopover
            popoverButtonProps={{
                size: "icon",
                className: cn("size-8 xs:size-10", isSelectCardView ? "hidden" : ""),
                title: t("project.Assign members"),
            }}
            popoverContentProps={{
                className: "w-full max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.10))]",
                align: "start",
            }}
            userAvatarListProps={{
                maxVisible: 6,
                size: { initial: "sm", xs: "default" },
                spacing: "3",
                listAlign: "start",
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
            addIconSize="6"
            onSave={save}
            isValidating={isValidating}
            allItems={allItems}
            groups={groups}
            selectableFilter={(item) => item.uid !== owner.uid && !bots.includes(item as BotModel.TModel)}
            newItemFilter={(item) => invitedMembers.includes(item as User.TModel)}
            assignedFilter={(item) => {
                if (item instanceof User.Model) {
                    return members.includes(item);
                } else {
                    return bots.includes(item);
                }
            }}
            initialSelectedItems={allItems.filter((item) => members.includes(item as User.TModel) || invitedMembers.includes(item as User.TModel))}
            canAssignNonMembers
            createNewUserLabel={(item) => `${getMultiSelectItemLabel(item).trim()} (${t("project.invited")})`}
            canEdit={canEdit}
            projectUID={project.uid}
        />
    );
});

export default BoardMemberList;

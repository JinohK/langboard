import { MultiSelectMemberPopover } from "@/components/MultiSelectMemberPopover";
import { Toast } from "@/components/base";
import useUpdateProjectAssignedUsers from "@/controllers/api/board/useUpdateProjectAssignedUsers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardMemberListProps {
    project: Project.TModel;
    isSelectCardView: bool;
}

const BoardMemberList = memo(({ project, isSelectCardView }: IBoardMemberListProps) => {
    const [t, i18n] = useTranslation();
    const members = project.useForeignField<User.TModel>("members");
    const invitedMembers = project.useForeignField<User.TModel>("invited_members");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateProjectAssignedUsersMutateAsync } = useUpdateProjectAssignedUsers();

    const save = (users: User.TModel[], endCallback: () => void) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = updateProjectAssignedUsersMutateAsync({
            uid: project.uid,
            emails: users.map((user) => user.email),
            lang: i18n.language,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error: unknown) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                    },
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("project.errors.Project not found.");
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: () => {
                return t("project.Assigned members updated and invited new users successfully.");
            },
            finally: () => {
                endCallback();
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <MultiSelectMemberPopover
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
            onSave={save}
            isValidating={isValidating}
            allUsers={members}
            assignedUsers={members}
            newUsers={invitedMembers}
            iconSize="6"
            canControlAssignedUsers
            canAssignNonMembers
            useGroupMembers
            createNewUserLabel={(user) => `${user.firstname} ${user.lastname}${user.lastname ? " " : ""}(${t("project.invited")})`}
        />
    );
});

export default BoardMemberList;

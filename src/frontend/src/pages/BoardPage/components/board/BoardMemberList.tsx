import { AssignMemberPopover } from "@/components/AssignMemberPopover";
import { Toast } from "@/components/base";
import useUpdateProjectAssignedUsers from "@/controllers/api/board/useUpdateProjectAssignedUsers";
import useProjectAssignedUsersUpdatedHandlers, {
    IProjectAssignedUsersUpdatedResponse,
} from "@/controllers/socket/board/useProjectAssignedUsersUpdatedHandlers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { Project, User } from "@/core/models";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const setInvitedText = (invitedMembers: User.Interface[], invitedText: string) => {
    for (let i = 0; i < invitedMembers.length; ++i) {
        const invitedMember = invitedMembers[i];
        if (invitedMember.lastname.includes(invitedText)) {
            continue;
        }

        invitedMember.lastname = invitedMember.lastname.length ? `${invitedMember.lastname} (${invitedText})` : `(${invitedText})`;
    }
};

const BoardMemberList = memo(({ project, socket }: { project: Project.IBoard; socket: ISocketContext }) => {
    const [t, i18n] = useTranslation();
    const [members, setMembers] = useState<User.Interface[]>(project.members);
    const [invitedMembers, setInvitedMembers] = useState<User.Interface[]>(project.invited_users);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateProjectAssignedUsersMutateAsync } = useUpdateProjectAssignedUsers();
    const updatedCallback = useCallback(
        (response: IProjectAssignedUsersUpdatedResponse) => {
            setInvitedText(response.invited_users, t("project.invited"));
            project.members = response.assigned_users;
            project.invited_users = response.invited_users;
            setMembers(() => response.assigned_users);
            setInvitedMembers(() => response.invited_users);
        },
        [members, invitedMembers]
    );
    const handlers = useProjectAssignedUsersUpdatedHandlers({
        projectUID: project.uid,
        socket,
        callback: updatedCallback,
    });
    useSwitchSocketHandlers({ socket, handlers });

    useEffect(() => {
        setInvitedText(invitedMembers, t("project.invited"));
    }, []);

    const save = (users: User.Interface[], endCallback: () => void) => {
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
        <AssignMemberPopover
            popoverButtonProps={{
                size: "icon",
                className: "size-8 xs:size-10",
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
        />
    );
});

export default BoardMemberList;

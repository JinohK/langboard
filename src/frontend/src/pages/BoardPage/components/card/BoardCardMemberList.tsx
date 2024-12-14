import { AssignMemberPopover } from "@/components/AssignMemberPopover";
import { Toast } from "@/components/base";
import useUpdateCardAssignedUsers from "@/controllers/api/card/useUpdateCardAssignedUsers";
import useCardAssignedUsersUpdatedHandlers from "@/controllers/socket/card/useCardAssignedUsersUpdatedHandlers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { User } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardCardMemberList = memo(({ members: flatMembers }: { members: User.Interface[] }) => {
    const { projectUID, card, sharedClassNames, currentUser, socket } = useBoardCard();
    const [t] = useTranslation();
    const [members, setMembers] = useState<User.Interface[]>(flatMembers);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateCardAssignedUsersMutateAsync } = useUpdateCardAssignedUsers();
    const { on: onCardAssignedUsersUpdated } = useCardAssignedUsersUpdatedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.members = data.assigned_users;
            setMembers(data.assigned_users);
        },
    });

    useEffect(() => {
        const { off } = onCardAssignedUsersUpdated();

        return () => {
            off();
        };
    }, []);

    const onSave = (users: User.Interface[], endCallback: () => void) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = updateCardAssignedUsersMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            assigned_users: users.map((user) => user.id),
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
                        message = t("card.Card not found.");
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
                return t("card.Assigned members updated successfully.");
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
            onSave={onSave}
            isValidating={isValidating}
            allUsers={card.project_members}
            assignedUsers={members}
            currentUser={currentUser}
            iconSize={{ initial: "4", lg: "6" }}
            canControlAssignedUsers
        />
    );
});

export default BoardCardMemberList;

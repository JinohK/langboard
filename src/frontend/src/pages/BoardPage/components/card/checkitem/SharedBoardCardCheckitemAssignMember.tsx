import { AssignMemberPopover } from "@/components/AssignMemberPopover";
import { ProjectCheckitem, User } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface ISharedBoardCardCheckitemAssignMemberProps {
    checkitem: ProjectCheckitem.IBaseBoard;
    members: User.Interface[];
    isValidating: bool;
    setIsValidating: (state: bool) => void;
}

const SharedBoardCardCheckitemAssignMember = memo(
    ({ members: flatMembers, isValidating, setIsValidating }: ISharedBoardCardCheckitemAssignMemberProps): JSX.Element => {
        const { projectUID, card, socket, currentUser, sharedClassNames } = useBoardCard();
        const [members, setMembers] = useState(flatMembers);
        const [t] = useTranslation();

        const onSave = (users: User.Interface[], endCallback: () => void) => {
            if (isValidating) {
                return;
            }

            setIsValidating(true);

            setTimeout(() => {
                endCallback();
                setIsValidating(false);
            }, 1500);
            // TODO: Implement the logic to assign members to the card checkitem
        };

        return (
            <AssignMemberPopover
                popoverButtonProps={{
                    size: "icon-sm",
                    className: "size-6 lg:size-8",
                    title: t("card.Assign members"),
                }}
                popoverContentProps={{
                    className: sharedClassNames.popoverContent,
                    align: "start",
                }}
                userAvatarListProps={{
                    maxVisible: 3,
                    size: { initial: "xs", lg: "sm" },
                    spacing: "4",
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
    }
);

export default SharedBoardCardCheckitemAssignMember;

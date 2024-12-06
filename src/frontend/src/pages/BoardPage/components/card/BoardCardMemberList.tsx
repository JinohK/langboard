import { AssignMemberPopover } from "@/components/AssignMemberPopover";
import { User } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardCardMemberList = memo(({ members }: { members: User.Interface[] }) => {
    const { card, sharedClassNames, currentUser } = useBoardCard();
    const [t] = useTranslation();
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);

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
                selectedState: [selectedMembers, setSelectedMembers],
                placeholder: t("card.Select members..."),
                className: cn(
                    "max-w-[calc(100vw_-_theme(spacing.20))]",
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]"
                ),
                inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
            }}
            onSave={(users) => {}}
            isValidating={isValidating}
            allUsers={card.project_members}
            assignedUsers={members}
            currentUser={currentUser}
            iconSize={{ initial: "4", lg: "6" }}
            canRemoveAlreadyAssigned
        />
    );
});

export default BoardCardMemberList;

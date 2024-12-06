import { AssignMemberPopover } from "@/components/AssignMemberPopover";
import { User } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardMemberList = memo(({ members }: { members: User.Interface[] }) => {
    const [t] = useTranslation();
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    return (
        <AssignMemberPopover
            popoverButtonProps={{
                size: "icon",
                className: "size-8 xs:size-10",
                title: t("project.Assign members"),
            }}
            userAvatarListProps={{
                maxVisible: 6,
                size: { initial: "sm", xs: "default" },
                spacing: "3",
                listAlign: "start",
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
            allUsers={members}
            assignedUsers={members}
            iconSize="6"
            canRemoveAlreadyAssigned
        />
    );
});

export default BoardMemberList;

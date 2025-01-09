import { MultiSelectAssigneesPopover, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import { ProjectCheckitem, User, UserGroup } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface ISharedBoardCardCheckitemAssignMemberProps {
    checkitem: ProjectCheckitem.TModel;
    isValidating: bool;
    setIsValidating: (state: bool) => void;
}

const SharedBoardCardCheckitemAssignMember = memo(
    ({ checkitem, isValidating, setIsValidating }: ISharedBoardCardCheckitemAssignMemberProps): JSX.Element => {
        const { card, currentUser, sharedClassNames } = useBoardCard();
        const projectMembers = card.useForeignField<User.TModel>("project_members");
        const members = checkitem.useForeignField<User.TModel>("assigned_members");
        const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");
        const [t] = useTranslation();

        const onSave = (items: TMultiSelectAssigneeItem[], endCallback: () => void) => {
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
            <MultiSelectAssigneesPopover
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
                addIconSize={{ initial: "4", lg: "6" }}
                onSave={onSave}
                isValidating={isValidating}
                allItems={projectMembers}
                groups={groups}
                assignedFilter={(item) => members.includes(item as User.TModel)}
                initialSelectedItems={members}
            />
        );
    }
);

export default SharedBoardCardCheckitemAssignMember;

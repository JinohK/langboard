import { Button, Flex, IconComponent, Popover } from "@/components/base";
import UserAvatarList from "@/components/UserAvatarList";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const SharedBoardCardCheckitemAssignMember = memo((): JSX.Element => {
    const { projectUID, card, socket, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    return (
        <Flex items="center" gap="1">
            {checkitem.assigned_members.length > 0 && (
                <UserAvatarList users={checkitem.assigned_members} maxVisible={3} spacing="none" size="xs" className="space-x-1" />
            )}
            <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpened}>
                <Popover.Trigger asChild>
                    <Button variant="outline" size="icon-sm" title={t("card.Assign members")} className="size-6">
                        <IconComponent icon="plus" size="4" />
                    </Button>
                </Popover.Trigger>
                <Popover.Content className={sharedClassNames.morePopover} align="start">
                    Assign members
                </Popover.Content>
            </Popover.Root>
        </Flex>
    );
});

export default SharedBoardCardCheckitemAssignMember;

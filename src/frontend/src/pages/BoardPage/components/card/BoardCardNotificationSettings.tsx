import NotificationSetting from "@/components/NotificationSetting";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { memo } from "react";

const BoardCardNotificationSettings = memo(() => {
    const { projectUID, card, currentUser } = useBoardCard();

    return (
        <NotificationSetting.SpecificScopedPopover
            type="card"
            form={{
                project_uid: projectUID,
                card_uid: card.uid,
            }}
            currentUser={currentUser}
            specificUID={card.uid}
            triggerProps={{
                variant: "ghost",
                size: "icon-sm",
                className: "ml-2.5 text-primary hover:text-primary",
            }}
            iconProps={{
                size: "5",
                strokeWidth: "3",
            }}
            onlyPopover
        />
    );
});

export default BoardCardNotificationSettings;

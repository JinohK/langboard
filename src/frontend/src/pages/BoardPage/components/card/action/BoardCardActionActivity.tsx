import ActivityList from "@/components/ActivityList";
import { Button, IconComponent, Popover } from "@/components/base";
import useGetActivities from "@/controllers/api/activity/useGetActivities";
import { ActivityModel } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionActivityProps extends ISharedBoardCardActionProps {}

const BoardCardActionActivity = memo(({ buttonClassName }: IBoardCardActionActivityProps) => {
    const { projectUID, card } = useBoardCard();
    const [t] = useTranslation();
    const activities = ActivityModel.Model.useModels(
        (model) =>
            model.filterable_type === "project" &&
            model.filterable_uid === projectUID &&
            model.sub_filterable_type === "card" &&
            model.sub_filterable_uid === card.uid
    );

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="history" size="4" />
                    {t("card.Activity")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-full p-0">
                <ActivityList
                    mutation={() => useGetActivities({ type: "card", project_uid: projectUID, card_uid: card.uid })}
                    activities={activities}
                    scrollAreaClassName={cn(
                        "w-[calc(100vw_-_theme(spacing.9))]",
                        "sm:w-[calc(theme(screens.sm)_-_theme(spacing.9))]",
                        "lg:w-[calc(theme(screens.md)_-_theme(spacing.9))]"
                    )}
                    infiniteScrollerClassName="max-h-[min(70vh,calc(var(--radix-popper-available-height)_-_theme(spacing.4)))] p-3"
                    isCurrentUser
                />
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionActivity;

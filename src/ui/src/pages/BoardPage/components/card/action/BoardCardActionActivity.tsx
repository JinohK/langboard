import ActivityList from "@/components/ActivityList";
import { Box, Button, IconComponent, Popover } from "@/components/base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionActivityProps extends ISharedBoardCardActionProps {}

const BoardCardActionActivity = memo(({ buttonClassName }: IBoardCardActionActivityProps) => {
    const { projectUID, card, currentUser } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    return (
        <Popover.Root open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="history" size="4" />
                    {t("card.Activity")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-full p-0">
                <Box
                    className={cn(
                        "w-[calc(100vw_-_theme(spacing.9))]",
                        "sm:w-[calc(theme(screens.sm)_-_theme(spacing.9))]",
                        "lg:w-[calc(theme(screens.md)_-_theme(spacing.9))]"
                    )}
                >
                    <ActivityList
                        form={{ listType: "ActivityModel", type: "card", project_uid: projectUID, card_uid: card.uid }}
                        currentUser={currentUser}
                        infiniteScrollerClassName="max-h-[min(70vh,calc(var(--radix-popper-available-height)_-_theme(spacing.4)))] p-3"
                    />
                </Box>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionActivity;

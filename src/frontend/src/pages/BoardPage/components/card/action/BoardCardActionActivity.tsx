import { Button, IconComponent, Popover, ScrollArea } from "@/components/base";
import { TimelineVariants } from "@/components/base/Timeline";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetCardActivities from "@/controllers/api/activity/useGetCardActivities";
import useCreateActivityTimeline from "@/core/hooks/useCreateActivityTimeline";
import { Activity } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionActivityProps extends ISharedBoardCardActionProps {}

const BoardCardActionActivity = memo(({ buttonClassName }: IBoardCardActionActivityProps) => {
    const { projectUID, card, currentUser } = useBoardCard();
    const [t] = useTranslation();
    const pageRef = useRef(1);
    const [activities, setActivities] = useState<Activity.Interface[]>([]);
    const { SkeletonActivity, ActivityTimeline } = useCreateActivityTimeline("card", true);
    const {
        data: rawActivities,
        fetchNextPage,
        hasNextPage,
    } = useGetCardActivities(
        { project_uid: projectUID, card_uid: card.uid, page: pageRef.current, limit: 20 },
        {
            getNextPageParam: (lastPage, _, lastPageParam) => {
                if (lastPage.activities.length === lastPageParam.limit) {
                    return {
                        ...lastPageParam,
                        page: lastPageParam.page + 1,
                    };
                } else {
                    return undefined;
                }
            },
        }
    );
    const cardActivityListId = useRef(createShortUUID());

    useEffect(() => {
        if (rawActivities) {
            setActivities((prev) => {
                return [
                    ...prev,
                    ...rawActivities.pages
                        .flatMap((page) => page.activities)
                        .filter((activity) => !prev.some((prevActivity) => prevActivity.uid === activity.uid)),
                ];
            });
            setActivities(rawActivities.pages.flatMap((page) => page.activities));
        }
    }, [rawActivities]);

    const nextPage = (page: number) => {
        if (page - pageRef.current > 1) {
            return false;
        }

        return new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await fetchNextPage();
                pageRef.current = page;
                resolve(true);
            }, 2500);
        });
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="history" size="4" />
                    {t("card.Activity")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-full p-0">
                <ScrollArea.Root
                    viewportId={cardActivityListId.current}
                    mutable={activities}
                    className={cn(
                        "w-[calc(100vw_-_theme(spacing.9))]",
                        "sm:w-[calc(theme(screens.sm)_-_theme(spacing.9))]",
                        "lg:w-[calc(theme(screens.md)_-_theme(spacing.9))]"
                    )}
                >
                    <InfiniteScroller
                        as="ul"
                        scrollable={() => document.getElementById(cardActivityListId.current)}
                        loadMore={nextPage}
                        loader={<SkeletonActivity key={createShortUUID()} />}
                        hasMore={hasNextPage}
                        threshold={140}
                        className={cn(
                            TimelineVariants(),
                            "max-h-[min(70vh,calc(var(--radix-popper-available-height)_-_theme(spacing.4)))] py-3 pr-3"
                        )}
                    >
                        {activities.map((activity) => (
                            <ActivityTimeline activity={activity} user={currentUser} key={createShortUUID()} />
                        ))}
                    </InfiniteScroller>
                    <ScrollArea.Bar orientation="horizontal" mutable={activities} />
                </ScrollArea.Root>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionActivity;

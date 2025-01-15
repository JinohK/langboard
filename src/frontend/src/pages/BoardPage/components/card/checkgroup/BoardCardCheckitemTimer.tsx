import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { memo, useEffect, useMemo, useReducer } from "react";
import { add as addDate, intervalToDuration, differenceInSeconds } from "date-fns";
import { Box, Button, Flex, IconComponent, Popover, Toast } from "@/components/base";
import { ECheckitemStatus } from "@/core/models/ProjectCheckitem";
import { useTranslation } from "react-i18next";
import { formatTimerDuration } from "@/core/utils/StringUtils";
import useChangeCardCheckitemStatus from "@/controllers/api/card/checkitem/useChangeCardCheckitemStatus";
import { useBoardCard } from "@/core/providers/BoardCardProvider";

const BoardCardCheckitemTimer = memo(() => {
    const { checkitem } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const status = checkitem.useField("status");
    const accumulatedSeconds = checkitem.useField("accumulated_seconds");
    const timerStartedAt = checkitem.useField("timer_started_at");
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const duration = useMemo(() => {
        const now = new Date();
        let timerSeconds = accumulatedSeconds;
        if (status === ECheckitemStatus.Started && timerStartedAt) {
            timerSeconds += differenceInSeconds(now, timerStartedAt);
        }

        return intervalToDuration({
            start: now,
            end: addDate(now, { seconds: timerSeconds }),
        });
    }, [updated]);

    useEffect(() => {
        let timerTimeout: NodeJS.Timeout | undefined;

        const updateTimer = () => {
            clearTimeout(timerTimeout);
            timerTimeout = undefined;

            let nextMs = 1000;

            if (status === ECheckitemStatus.Started && timerStartedAt) {
                const startDate = new Date(timerStartedAt);
                const diff = new Date(new Date().getTime() - startDate.getTime()).getMilliseconds();
                nextMs = 1000 + startDate.getMilliseconds() - diff;
                forceUpdate();
            }

            timerTimeout = setTimeout(updateTimer, nextMs);
        };

        updateTimer();

        return () => {
            clearTimeout(timerTimeout);
            timerTimeout = undefined;
        };
    }, [status]);

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2" title={t("card.Manage timer")}>
                    {(!!accumulatedSeconds || status === ECheckitemStatus.Started) && (
                        <Box textSize={{ initial: "xs", sm: "sm" }}>{formatTimerDuration(duration)}</Box>
                    )}
                    <IconComponent icon="hammer" size="4" />
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-auto p-0">
                <BoardCardCheckitemTimerManager />
            </Popover.Content>
        </Popover.Root>
    );
});

function BoardCardCheckitemTimerManager() {
    const { projectUID, card } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const status = checkitem.useField("status");
    const { mutateAsync: changeCheckitemStatusMutateAsync } = useChangeCardCheckitemStatus();

    const changeStatus = (newStatus: ECheckitemStatus) => {
        const promise = changeCheckitemStatusMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
            status: newStatus,
        });

        let timerStatus = "";
        switch (newStatus) {
            case ECheckitemStatus.Started:
                timerStatus = "started";
                break;
            case ECheckitemStatus.Paused:
                timerStatus = "paused";
                break;
            case ECheckitemStatus.Stopped:
                timerStatus = "stopped";
                break;
        }

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: sharedErrorHandler,
            success: () => {
                return t(`card.successes.Timer ${timerStatus} successfully.`);
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Flex>
            <Button
                variant="ghost"
                size="icon"
                title={t("card.Start timer")}
                className="rounded-r-none"
                disabled={isValidating || status === ECheckitemStatus.Started}
                onClick={() => changeStatus(ECheckitemStatus.Started)}
            >
                <IconComponent icon="play" size="5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                title={t("card.Pause timer")}
                className="rounded-none"
                disabled={isValidating || status !== ECheckitemStatus.Started}
                onClick={() => changeStatus(ECheckitemStatus.Paused)}
            >
                <IconComponent icon="pause" size="5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                title={t("card.Stop timer")}
                className="rounded-l-none"
                disabled={isValidating || status === ECheckitemStatus.Stopped}
                onClick={() => changeStatus(ECheckitemStatus.Stopped)}
            >
                <IconComponent icon="circle-stop" size="5" />
            </Button>
        </Flex>
    );
}

export default BoardCardCheckitemTimer;

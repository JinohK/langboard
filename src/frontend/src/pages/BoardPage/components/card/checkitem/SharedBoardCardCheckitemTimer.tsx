import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { memo, useEffect, useMemo, useReducer } from "react";
import { add as addDate, intervalToDuration, differenceInSeconds, Duration } from "date-fns";
import useCardCheckitemTimerStartedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStartedHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import useCardCheckitemTimerStoppedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStoppedHandlers";
import { Box } from "@/components/base";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";

const SharedBoardCardCheckitemTimer = memo(() => {
    const { projectUID, socket } = useBoardCard();
    const { checkitem } = useBoardCardCheckitem();
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const duration = useMemo(() => {
        const now = new Date();
        let timerSeconds = checkitem.acc_time_seconds;
        if (checkitem.timer) {
            timerSeconds += differenceInSeconds(now, checkitem.timer.started_at);
        }

        return intervalToDuration({
            start: now,
            end: addDate(now, { seconds: timerSeconds }),
        });
    }, [updated]);
    const checkitemTimerStartedHandler = useCardCheckitemTimerStartedHandlers({
        socket,
        projectUID,
        checkitemUID: checkitem.uid,
        callback: (data) => {
            checkitem.timer = data.timer;
            checkitem.acc_time_seconds = data.acc_time_seconds;
            forceUpdate();
        },
    });
    const checkitemTimerStoppedHandler = useCardCheckitemTimerStoppedHandlers({
        socket,
        projectUID,
        checkitemUID: checkitem.uid,
        callback: (data) => {
            checkitem.timer = undefined;
            checkitem.acc_time_seconds = data.acc_time_seconds;
            forceUpdate();
        },
    });
    useSwitchSocketHandlers({ socket, handlers: [checkitemTimerStartedHandler, checkitemTimerStoppedHandler] });

    useEffect(() => {
        let timerTimeout: NodeJS.Timeout | undefined;

        const updateTimer = () => {
            clearTimeout(timerTimeout);
            timerTimeout = undefined;

            let nextMs = 1000;

            if (checkitem.timer) {
                const startDate = new Date(checkitem.timer.started_at);
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
    }, []);

    return <Box textSize={{ initial: "xs", sm: "sm" }}>{formatDuration(duration)}</Box>;
});

const formatDuration = (duration: Duration) => {
    let hours = duration.hours ?? 0;
    if (duration.years) {
        hours += duration.years * 365 * 24;
    }
    if (duration.months) {
        hours += duration.months * 30 * 24;
    }
    if (duration.days) {
        hours += duration.days * 24;
    }

    const timeTextChunks: string[] = [];
    if (hours > 0) {
        timeTextChunks.push(`${hours}h`);
    }
    if (hours < 100) {
        if (duration.minutes) {
            timeTextChunks.push(`${duration.minutes}m`);
        }
        if (duration.seconds) {
            timeTextChunks.push(`${duration.seconds}s`);
        }
    }

    return timeTextChunks.join(" ");
};

export default SharedBoardCardCheckitemTimer;

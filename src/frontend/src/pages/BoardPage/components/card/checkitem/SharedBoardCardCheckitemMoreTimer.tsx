import { Button, DropdownMenu, Flex, Popover, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import useToggleCheckitemTimer from "@/controllers/api/card/checkitem/useToggleCheckitemTimer";
import useCardCheckitemTimerStartedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStartedHandlers";
import useCardCheckitemTimerStoppedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStoppedHandlers";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemMoreTimer({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, socket, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler, update } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: toggleCheckitemTimerMutateAsync } = useToggleCheckitemTimer();
    const { send: sendCheckitemTimerStarted } = useCardCheckitemTimerStartedHandlers({ socket, checkitemUID: checkitem.uid });
    const { send: sendCheckitemTimerStopped } = useCardCheckitemTimerStoppedHandlers({ socket, checkitemUID: checkitem.uid });

    const toggleTimer = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = toggleCheckitemTimerMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            checkitem_uid: checkitem.uid,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t(`common.${checkitem.timer ? "Stopping" : "Starting"}...`),
            error: sharedErrorHandler,
            success: (data) => {
                const isStopped = !!data.timer.stopped_at;
                if (isStopped) {
                    checkitem.timer = undefined;
                } else {
                    checkitem.timer = data.timer;
                }
                checkitem.acc_time_seconds = data.acc_time_seconds;
                update();
                const sendTimer = isStopped ? sendCheckitemTimerStopped : sendCheckitemTimerStarted;
                sendTimer({
                    checkitem_uid: checkitem.uid,
                    timer: data.timer,
                    acc_time_seconds: data.acc_time_seconds,
                });
                return t(`card.Timer ${isStopped ? "stopped" : "started"} successfully.`);
            },
            finally: () => {
                setIsValidating(false);
                setIsMoreMenuOpened(false);
                setIsOpened(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <DropdownMenu.Item
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpened(true);
                    }}
                >
                    {t(`card.${checkitem.timer ? "Stop" : "Start"} timer`)}
                </DropdownMenu.Item>
            </Popover.Trigger>
            <Popover.Content className={sharedClassNames.morePopover} align="end">
                <div className="mb-1 text-center text-sm font-semibold sm:text-base">
                    {t(`card.Are you sure you want to ${checkitem.timer ? "stop" : "start"} the timer?`)}
                </div>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton
                        type="button"
                        size="sm"
                        variant={checkitem.timer ? "destructive" : "default"}
                        onClick={toggleTimer}
                        isValidating={isValidating}
                    >
                        {t(`card.${checkitem.timer ? "Stop" : "Start"}`)}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default SharedBoardCardCheckitemMoreTimer;

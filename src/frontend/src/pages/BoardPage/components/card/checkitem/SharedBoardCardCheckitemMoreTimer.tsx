import { Box, Button, DropdownMenu, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useToggleCheckitemTimer from "@/controllers/api/card/checkitem/useToggleCheckitemTimer";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemMoreTimer({ setIsMoreMenuOpened }: { setIsMoreMenuOpened: (value: bool) => void }): JSX.Element {
    const { projectUID, card, sharedClassNames } = useBoardCard();
    const { checkitem, isValidating, setIsValidating, sharedErrorHandler } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { mutateAsync: toggleCheckitemTimerMutateAsync } = useToggleCheckitemTimer();

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
                return t(`card.successes.Timer ${isStopped ? "stopped" : "started"} successfully.`);
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
            <Popover.Content className={sharedClassNames.popoverContent} align="end">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t(`card.Are you sure you want to ${checkitem.timer ? "stop" : "start"} the timer?`)}
                </Box>
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

import { Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useRescheduleProjectBotCron from "@/controllers/api/board/settings/useRescheduleProjectBotCron";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotSchedule } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotScheduleForm, {
    IBotScheduleFormMap,
    IBotScheduleTriggersMap,
} from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleForm";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleEditProps {
    botUID: string;
    schedule: BotSchedule.TModel;
    variant?: React.ComponentProps<typeof Button>["variant"];
    className?: string;
}

function BoardSettingsCronBotScheduleEdit({
    botUID,
    schedule,
    variant = "outline",
    className = "border-0 [&:first-child]:rounded-b-none [&:not(:first-child)]:rounded-t-none [&:not(:first-child)]:border-t",
}: IBoardSettingsCronBotScheduleEditProps): JSX.Element {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: rescheduleProjectBotCronMutateAsync } = useRescheduleProjectBotCron();
    const runningType = schedule.useField("running_type");
    const intervalStr = schedule.useField("interval_str");
    const targetTable = schedule.useField("target_table");
    const targetUID = schedule.useField("target_uid");
    const startAt = schedule.useField("start_at");
    const endAt = schedule.useField("end_at");
    const valuesMapRef = useRef<IBotScheduleFormMap>({
        runningType: runningType,
        interval: intervalStr,
        scopeType: targetTable,
        scopeUID: targetUID,
        startAt: startAt,
        endAt: endAt,
    });
    const triggersMapRef = useRef<IBotScheduleTriggersMap>({});
    const [isOpened, setIsOpened] = useState(false);

    const createSchedule = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        valuesMapRef.current.runningType = valuesMapRef.current.runningType ?? BotSchedule.ERunningType.Infinite;

        if (BotSchedule.RUNNING_TYPES_WITH_START_AT.includes(valuesMapRef.current.runningType)) {
            if (!valuesMapRef.current.startAt) {
                Toast.Add.error(t("project.settings.errors.Cron start time is required."));
                triggersMapRef.current.startAt?.focus();
                return;
            }
        }

        if (BotSchedule.RUNNING_TYPES_WITH_END_AT.includes(valuesMapRef.current.runningType)) {
            if (!valuesMapRef.current.endAt) {
                Toast.Add.error(t("project.settings.errors.Cron end time is required."));
                triggersMapRef.current.endAt?.focus();
                return;
            }
        }

        const promise = rescheduleProjectBotCronMutateAsync({
            project_uid: project.uid,
            bot_uid: botUID,
            schedule_uid: schedule.uid,
            interval: valuesMapRef.current.interval,
            scope: {
                type: valuesMapRef.current.scopeType,
                uid: valuesMapRef.current.scopeUID,
            },
            running_type: valuesMapRef.current.runningType,
            start_at: valuesMapRef.current.startAt,
            end_at: valuesMapRef.current.endAt,
        });

        Toast.Add.promise(promise, {
            loading: t("project.settings.Rescheduling..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Bot rescheduled successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
            },
        });
    };

    return (
        <Popover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <Button size="sm" variant={variant} disabled={isValidating} className={className}>
                    {t("project.settings.Reschedule")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <BoardSettingsCronBotScheduleForm
                    initialValuesMap={{
                        runningType: runningType,
                        interval: intervalStr,
                        scopeType: targetTable,
                        scopeUID: targetUID,
                        startAt: startAt,
                        endAt: endAt,
                    }}
                    valuesMapRef={valuesMapRef}
                    triggersMapRef={triggersMapRef}
                    disabled={isValidating}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={createSchedule} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardSettingsCronBotScheduleEdit;

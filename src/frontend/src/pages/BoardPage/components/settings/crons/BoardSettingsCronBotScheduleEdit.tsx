import { Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useRescheduleProjectBotCron from "@/controllers/api/board/settings/useRescheduleProjectBotCron";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotSchedule } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotScheduleInput, { IBotScheduleFormMap } from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleForm";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleEditProps {
    botUID: string;
    schedule: BotSchedule.TModel;
}

function BoardSettingsCronBotScheduleEdit({ botUID, schedule }: IBoardSettingsCronBotScheduleEditProps): JSX.Element {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: rescheduleProjectBotCronMutateAsync } = useRescheduleProjectBotCron();
    const intervalStr = schedule.useField("interval_str");
    const targetTable = schedule.useField("target_table");
    const targetUID = schedule.useField("target_uid");
    const valuesMapRef = useRef<IBotScheduleFormMap>({
        interval: intervalStr,
        scopeType: targetTable,
        scopeUID: targetUID,
    });
    const scopeTypeButtonRef = useRef<HTMLButtonElement>(null);
    const scopeUIDButtonRef = useRef<HTMLButtonElement>(null);
    const [isOpened, setIsOpened] = useState(false);

    const createSchedule = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = rescheduleProjectBotCronMutateAsync({
            project_uid: project.uid,
            bot_uid: botUID,
            schedule_uid: schedule.uid,
            interval: valuesMapRef.current.interval,
            scope: {
                type: valuesMapRef.current.scopeType,
                uid: valuesMapRef.current.scopeUID,
            },
        });

        Toast.Add.promise(promise, {
            loading: t("common.Rescheduling..."),
            error: (error: unknown) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                    },
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("project.errors.Project not found.");
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
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
                <Button
                    size="sm"
                    variant="outline"
                    disabled={isValidating}
                    className="border-0 [&:first-child]:rounded-b-none [&:not(:first-child)]:rounded-t-none [&:not(:first-child)]:border-t"
                >
                    {t("project.settings.Reschedule")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <BoardSettingsCronBotScheduleInput
                    initialIntervalValue={intervalStr}
                    initialScopeType={targetTable}
                    initialScopeUID={targetUID}
                    valuesMapRef={valuesMapRef}
                    scopeTypeButtonRef={scopeTypeButtonRef}
                    scopeUIDButtonRef={scopeUIDButtonRef}
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

import { Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useScheduleProjectBotCron from "@/controllers/api/board/settings/useScheduleProjectBotCron";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotSchedule } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotScheduleForm, {
    IBotScheduleFormMap,
    IBotScheduleTriggersMap,
} from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleForm";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleAddButtonProps {
    botUID: string;
    copiedForm: IBotScheduleFormMap | undefined;
    isAddMode: bool;
    setIsAddMode: React.Dispatch<React.SetStateAction<bool>>;
}

function BoardSettingsCronBotScheduleAddButton({
    botUID,
    copiedForm,
    isAddMode,
    setIsAddMode,
}: IBoardSettingsCronBotScheduleAddButtonProps): JSX.Element {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: scheduleProjectBotCronMutateAsync } = useScheduleProjectBotCron();
    const valuesMapRef = useRef<IBotScheduleFormMap>(copiedForm ?? {});
    const triggersMapRef = useRef<IBotScheduleTriggersMap>({});

    const createCron = () => {
        if (isValidating) {
            return;
        }

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

        if (!valuesMapRef.current.scopeType) {
            Toast.Add.error(t("project.settings.errors.Cron scope type is required."));
            triggersMapRef.current.scopeType?.focus();
            return;
        }
        if (!valuesMapRef.current.scopeUID) {
            Toast.Add.error(t("project.settings.errors.Cron scope UID is required."));
            triggersMapRef.current.scopeUID?.focus();
            return;
        }

        setIsValidating(true);

        const promise = scheduleProjectBotCronMutateAsync({
            project_uid: project.uid,
            bot_uid: botUID,
            interval: valuesMapRef.current.interval ?? "* * * * *",
            scope: {
                type: valuesMapRef.current.scopeType,
                uid: valuesMapRef.current.scopeUID,
            },
            running_type: valuesMapRef.current.runningType,
            start_at: valuesMapRef.current.startAt,
            end_at: valuesMapRef.current.endAt,
        });

        Toast.Add.promise(promise, {
            loading: t("project.settings.Scheduling..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Bot scheduled successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsAddMode(false);
            },
        });
    };

    useEffect(() => {
        if (isAddMode) {
            valuesMapRef.current = copiedForm ?? {};
        }
    }, [isAddMode, copiedForm]);

    return (
        <Popover.Root modal open={isAddMode} onOpenChange={setIsAddMode}>
            <Popover.Trigger asChild>
                <Button variant="outline" className="w-full border-2 border-dashed" disabled={isValidating}>
                    {t("project.settings.Schedule")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <BoardSettingsCronBotScheduleForm
                    initialValuesMap={copiedForm}
                    valuesMapRef={valuesMapRef}
                    triggersMapRef={triggersMapRef}
                    disabled={isValidating}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsAddMode(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={createCron} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardSettingsCronBotScheduleAddButton;

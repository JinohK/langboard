import { Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useScheduleProjectBotCron from "@/controllers/api/board/settings/useScheduleProjectBotCron";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotScheduleInput, { IBotScheduleFormMap } from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleForm";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleAddButtonProps {
    botUID: string;
}

function BoardSettingsCronBotScheduleAddButton({ botUID }: IBoardSettingsCronBotScheduleAddButtonProps): JSX.Element {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: scheduleProjectBotCronMutateAsync } = useScheduleProjectBotCron();
    const valuesMapRef = useRef<IBotScheduleFormMap>({});
    const scopeTypeButtonRef = useRef<HTMLButtonElement>(null);
    const scopeUIDButtonRef = useRef<HTMLButtonElement>(null);
    const [isOpened, setIsOpened] = useState(false);

    const createCron = () => {
        if (isValidating) {
            return;
        }

        if (!valuesMapRef.current.scopeType) {
            Toast.Add.error(t("project.settings.errors.Cron scope type is required."));
            scopeTypeButtonRef.current?.focus();
            return;
        }
        if (!valuesMapRef.current.scopeUID) {
            Toast.Add.error(t("project.settings.errors.Cron scope UID is required."));
            scopeUIDButtonRef.current?.focus();
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
        });

        Toast.Add.promise(promise, {
            loading: t("project.settings.Scheduling..."),
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
                return t("project.settings.successes.Bot scheduled successfully.");
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
                <Button variant="outline" className="w-full border-2 border-dashed" disabled={isValidating}>
                    {t("project.settings.Schedule")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <BoardSettingsCronBotScheduleInput
                    valuesMapRef={valuesMapRef}
                    scopeTypeButtonRef={scopeTypeButtonRef}
                    scopeUIDButtonRef={scopeUIDButtonRef}
                    disabled={isValidating}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
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

import { Box, Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useUnscheduleProjectBotCron from "@/controllers/api/board/settings/useUnscheduleProjectBotCron";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotSchedule } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleDeleteProps {
    botUID: string;
    schedule: BotSchedule.TModel;
    variant?: React.ComponentProps<typeof Button>["variant"];
    className?: string;
}

function BoardSettingsCronBotScheduleDelete({
    botUID,
    schedule,
    variant = "outline",
    className = "border-0 [&:first-child]:rounded-b-none [&:not(:first-child)]:rounded-t-none [&:not(:first-child)]:border-t",
}: IBoardSettingsCronBotScheduleDeleteProps): JSX.Element {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: unscheduleProjectBotCronMutateAsync } = useUnscheduleProjectBotCron();
    const [isOpened, setIsOpened] = useState(false);

    const unschedule = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = unscheduleProjectBotCronMutateAsync({
            project_uid: project.uid,
            bot_uid: botUID,
            schedule_uid: schedule.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error: unknown) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Bot unscheduled successfully.");
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
                    {t("project.settings.Unschedule")}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("project.settings.Are you sure you want to unschedule this cron?")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.settings.All data will be lost.")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.settings.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" variant="destructive" onClick={unschedule} isValidating={isValidating}>
                        {t("project.settings.Unschedule")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default BoardSettingsCronBotScheduleDelete;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, Card, Flex } from "@/components/base";
import { CronText } from "@/components/Cron";
import { BotModel, BotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import BoardSettingsCronBotScheduleDelete from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleDelete";
import BoardSettingsCronBotScheduleEdit from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleEdit";
import { IBotScheduleFormMap } from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleForm";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleProps {
    bot: BotModel.TModel;
    schedule: BotSchedule.TModel;
    setCopiedForm: React.Dispatch<React.SetStateAction<IBotScheduleFormMap | undefined>>;
    setIsAddMode: React.Dispatch<React.SetStateAction<bool>>;
}

function BoardSettingsCronBotSchedule({ bot, schedule, setCopiedForm, setIsAddMode }: IBoardSettingsCronBotScheduleProps): JSX.Element {
    const [t] = useTranslation();
    const runningType = schedule.useField("running_type");
    const status = schedule.useField("status");
    const startAt = schedule.useField("start_at");
    const endAt = schedule.useField("end_at");
    const intervalStr = schedule.useField("interval_str");
    const targetTable = schedule.useField("target_table");
    const targetUID = schedule.useField("target_uid");
    const [Scope, scope] = useMemo(() => {
        if (targetTable === "project_column") {
            return [BoardSettingsCronBotScheduleColumnScope, ProjectColumn.Model.getModel(targetUID)];
        } else if (targetTable === "card") {
            return [BoardSettingsCronBotScheduleCardScope, ProjectCard.Model.getModel(targetUID)];
        } else {
            return [null, null];
        }
    }, [targetTable, targetUID]);
    const copy = useCallback(() => {
        setCopiedForm(() => ({
            runningType: schedule.running_type,
            interval: schedule.interval_str,
            scopeType: schedule.target_table,
            scopeUID: schedule.target_uid,
            startAt: schedule.start_at,
            endAt: schedule.end_at,
        }));

        setIsAddMode(true);
    }, [setIsAddMode, setCopiedForm]);

    return (
        <Card.Root className="sm:grid sm:grid-rows-4">
            <Card.Header className="pb-2">
                {!!Scope && scope && (
                    <Card.Title className="text-lg sm:text-2xl">
                        <Scope scope={scope as any} />
                    </Card.Title>
                )}
            </Card.Header>
            <Card.Content className="text-left sm:row-span-2 sm:pb-0">
                <Flex direction="col" gap="1.5">
                    <BoardSettingsCronBotScheduleSection title={t("project.settings.cronHeaders.Interval")}>
                        <CronText value={intervalStr} className="gap-y-0.5" />
                    </BoardSettingsCronBotScheduleSection>
                    <BoardSettingsCronBotScheduleSection title={t("project.settings.cronHeaders.Type")}>
                        {t(`project.settings.cronRunningTypes.${runningType}`)}
                    </BoardSettingsCronBotScheduleSection>
                    <BoardSettingsCronBotScheduleSection title={t("project.settings.cronHeaders.Status")}>
                        <Box
                            className={cn(
                                status === BotSchedule.EStatus.Pending && "text-yellow-500",
                                status === BotSchedule.EStatus.Started && "text-green-500",
                                status === BotSchedule.EStatus.Stopped && "text-red-500"
                            )}
                        >
                            {t(`project.settings.cronStatus.${status}`)}
                        </Box>
                    </BoardSettingsCronBotScheduleSection>
                    {BotSchedule.RUNNING_TYPES_WITH_START_AT.includes(runningType) && !!startAt && (
                        <BoardSettingsCronBotScheduleSection
                            title={t(`project.settings.cronHeaders.${runningType === BotSchedule.ERunningType.Onetime ? "Execute at" : "Start at"}`)}
                        >
                            {startAt.toLocaleString()}
                        </BoardSettingsCronBotScheduleSection>
                    )}
                    {BotSchedule.RUNNING_TYPES_WITH_END_AT.includes(runningType) && !!endAt && (
                        <BoardSettingsCronBotScheduleSection title={t("project.settings.cronHeaders.End at")}>
                            {endAt.toLocaleString()}
                        </BoardSettingsCronBotScheduleSection>
                    )}
                </Flex>
            </Card.Content>
            <Card.Footer className="justify-end gap-2">
                <BoardSettingsCronBotScheduleDelete botUID={bot.uid} schedule={schedule} className="" variant="secondary" />
                <Button variant="secondary" size="sm" onClick={copy}>
                    {t("common.Copy")}
                </Button>
                <BoardSettingsCronBotScheduleEdit botUID={bot.uid} schedule={schedule} className="" variant="default" />
            </Card.Footer>
        </Card.Root>
    );
}

interface IBoardSettingsCronBotScheduleSectionProps {
    title: string;
    children: React.ReactNode;
}

function BoardSettingsCronBotScheduleSection({ title, children }: IBoardSettingsCronBotScheduleSectionProps): JSX.Element {
    return (
        <Flex items="start" gap="1.5">
            <Box className="w-20 text-gray-500">{title}</Box>
            <Box weight="semibold">{children}</Box>
        </Flex>
    );
}

interface IBoardSettingsCronBotScheduleColumnScopeProps {
    scope: ProjectColumn.TModel;
}

function BoardSettingsCronBotScheduleColumnScope({ scope }: IBoardSettingsCronBotScheduleColumnScopeProps): JSX.Element {
    const name = scope.useField("name");

    return <>{name}</>;
}

interface IBoardSettingsCronBotScheduleCardScopeProps {
    scope: ProjectCard.TModel;
}

function BoardSettingsCronBotScheduleCardScope({ scope }: IBoardSettingsCronBotScheduleCardScopeProps): JSX.Element {
    const title = scope.useField("title");
    const columnName = scope.useField("column_name");

    return (
        <>
            {title} - {columnName}
        </>
    );
}

export default BoardSettingsCronBotSchedule;

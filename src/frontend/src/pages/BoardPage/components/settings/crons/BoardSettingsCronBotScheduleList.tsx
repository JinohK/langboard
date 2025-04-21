import { Box, ScrollArea, Table } from "@/components/base";
import useGetProjectBotSchedules from "@/controllers/api/board/settings/useGetProjectBotSchedules";
import useBoardBotCronScheduledHandlers from "@/controllers/socket/board/settings/useBoardBotCronScheduledHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { BotModel, BotSchedule } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotSchedule from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotSchedule";
import BoardSettingsCronBotScheduleAddButton from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleAddButton";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface IBOardSettingsCronBotScheduleListProps {
    bot: BotModel.TModel;
}

function BoardSettingsCronBotScheduleList({ bot }: IBOardSettingsCronBotScheduleListProps): JSX.Element {
    const [t] = useTranslation();
    const { socket, project } = useBoardSettings();
    const { mutate } = useGetProjectBotSchedules(project.uid);
    const schedules = BotSchedule.Model.useModels(
        (model) => model.bot_uid === bot.uid && model.filterable_table === "project" && model.filterable_uid === project.uid
    );
    const botCronScheduledHandlers = useBoardBotCronScheduledHandlers({
        projectUID: project.uid,
        botUID: bot.uid,
    });
    useSwitchSocketHandlers({ socket, handlers: [botCronScheduledHandlers] });

    useEffect(() => {
        mutate({ bot_uid: bot.uid }, {});
    }, []);

    return (
        <Box className="max-h-[70vh]">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head className="w-2/6 text-center" title={t("project.settings.cronTable.Scope")}>
                            {t("project.settings.cronTable.Scope")}
                        </Table.Head>
                        <Table.Head className="w-3/6 text-center" title={t("project.settings.cronTable.Interval")}>
                            {t("project.settings.cronTable.Interval")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("project.settings.cronTable.Manage")}>
                            {t("project.settings.cronTable.Manage")}
                        </Table.Head>
                    </Table.Row>
                </Table.Header>
            </Table.Root>
            <ScrollArea.Root mutable={schedules}>
                <Box className="max-h-[calc(70vh_-_theme(spacing.20)_-_theme(spacing.1))]">
                    <Table.Root>
                        <Table.Body>
                            {schedules.map((schedule) => (
                                <BoardSettingsCronBotSchedule key={schedule.uid} bot={bot} schedule={schedule} />
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </ScrollArea.Root>
            <BoardSettingsCronBotScheduleAddButton botUID={bot.uid} />
        </Box>
    );
}

export default BoardSettingsCronBotScheduleList;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Popover, Table } from "@/components/base";
import { CronText } from "@/components/Cron";
import { BotModel, BotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import BoardSettingsCronBotScheduleDelete from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleDelete";
import BoardSettingsCronBotScheduleEdit from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleEdit";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsCronBotScheduleProps {
    bot: BotModel.TModel;
    schedule: BotSchedule.TModel;
}

function BoardSettingsCronBotSchedule({ bot, schedule }: IBoardSettingsCronBotScheduleProps): JSX.Element {
    const [t] = useTranslation();
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

    return (
        <Table.Row>
            <Table.Cell className="w-2/6 max-w-0 truncate text-center">{!!Scope && scope && <Scope scope={scope as any} />}</Table.Cell>
            <Table.Cell className="w-3/6 max-w-0 truncate text-center">
                <CronText value={intervalStr} className="justify-center" />
            </Table.Cell>
            <Table.Cell className="w-1/6 max-w-0 text-center">
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <Button size="sm">{t("project.settings.cronTable.Manage")}</Button>
                    </Popover.Trigger>
                    <Popover.Content className="flex w-auto flex-col p-0">
                        <BoardSettingsCronBotScheduleEdit botUID={bot.uid} schedule={schedule} />
                        <BoardSettingsCronBotScheduleDelete botUID={bot.uid} schedule={schedule} />
                    </Popover.Content>
                </Popover.Root>
            </Table.Cell>
        </Table.Row>
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

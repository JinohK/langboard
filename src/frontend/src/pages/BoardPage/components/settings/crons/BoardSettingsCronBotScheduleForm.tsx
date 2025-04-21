/* eslint-disable @typescript-eslint/no-explicit-any */
import { Flex, Select } from "@/components/base";
import Cron from "@/components/Cron";
import { BotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotScheduleFormMap {
    interval?: string;
    scopeType?: BotSchedule.TTargetTable;
    scopeUID?: string;
}

export interface IBoardSettingsCronBotScheduleFormProps {
    initialIntervalValue?: string;
    initialScopeType?: BotSchedule.TTargetTable;
    initialScopeUID?: string;
    valuesMapRef: React.RefObject<IBotScheduleFormMap>;
    scopeTypeButtonRef?: React.RefObject<HTMLButtonElement | null>;
    scopeUIDButtonRef?: React.RefObject<HTMLButtonElement | null>;
    disabled?: bool;
}

function BoardSettingsCronBotScheduleForm({
    initialIntervalValue,
    initialScopeType,
    initialScopeUID,
    valuesMapRef,
    scopeTypeButtonRef,
    scopeUIDButtonRef,
    disabled,
}: IBoardSettingsCronBotScheduleFormProps): JSX.Element {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const columns = ProjectColumn.Model.useModels((model) => model.project_uid === project.uid);
    const cards = ProjectCard.Model.useModels((model) => model.project_uid === project.uid);
    const [scopeType, setScopeType] = useState<BotSchedule.TTargetTable | undefined>(initialScopeType);
    const [scopeUID, setScopeUID] = useState<string>(initialScopeUID ?? "");
    const [ScopeItem, scopeItems] = useMemo(() => {
        if (scopeType === "project_column") {
            return [BoardSettingsCronBotScheduleColumnScopeItem, columns];
        } else if (scopeType === "card") {
            return [BoardSettingsCronBotScheduleCardScopeItem, cards];
        }
        return [undefined, []];
    }, [scopeType, columns, cards]);

    const onChangeScopeType = (value: BotSchedule.TTargetTable) => {
        setScopeType(value);
        setScopeUID("");
        valuesMapRef.current.scopeType = value;
        valuesMapRef.current.scopeUID = undefined;
    };

    const onChangeScopeUID = (value: string) => {
        setScopeUID(value);
        valuesMapRef.current.scopeUID = value;
    };

    const onChangeCron = (value: string) => {
        valuesMapRef.current.interval = value;
    };

    return (
        <Flex direction="col" gap="2">
            <Select.Root value={scopeType} onValueChange={onChangeScopeType} disabled={disabled}>
                <Select.Trigger className="w-full" ref={scopeTypeButtonRef}>
                    <Select.Value placeholder={t("project.settings.Select scope type")} />
                </Select.Trigger>
                <Select.Content>
                    {BotSchedule.TARGET_TABLES.map((table) => (
                        <Select.Item key={table} value={table}>
                            {t(`project.settings.cronScopes.${table}`)}
                        </Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
            {!!scopeType && (
                <Select.Root value={scopeUID} onValueChange={onChangeScopeUID} disabled={disabled}>
                    <Select.Trigger className="w-full" ref={scopeUIDButtonRef}>
                        <Select.Value placeholder={t("project.settings.Select scope")} />
                    </Select.Trigger>
                    <Select.Content>
                        {!!scopeItems.length && ScopeItem && scopeItems.map((item) => <ScopeItem key={item.uid} item={item as any} />)}
                    </Select.Content>
                </Select.Root>
            )}
            <Cron value={initialIntervalValue ?? "@reboot"} setValue={onChangeCron} disabled={disabled} readOnly={disabled} />
        </Flex>
    );
}

interface IBoardSettingsCronBotScheduleColumnScopeItemProps {
    item: ProjectColumn.TModel;
}

function BoardSettingsCronBotScheduleColumnScopeItem({ item }: IBoardSettingsCronBotScheduleColumnScopeItemProps): JSX.Element {
    const name = item.useField("name");

    return <Select.Item value={item.uid}>{name}</Select.Item>;
}

interface IBoardSettingsCronBotScheduleCardScopeItemProps {
    item: ProjectCard.TModel;
}

function BoardSettingsCronBotScheduleCardScopeItem({ item }: IBoardSettingsCronBotScheduleCardScopeItemProps): JSX.Element {
    const title = item.useField("title");
    const columnName = item.useField("column_name");

    return (
        <Select.Item value={item.uid}>
            {title} - {columnName}
        </Select.Item>
    );
}

export default BoardSettingsCronBotScheduleForm;

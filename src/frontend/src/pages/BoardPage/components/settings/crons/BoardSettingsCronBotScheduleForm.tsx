/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, DateTimePicker, Flex, IconComponent, Select } from "@/components/base";
import Cron from "@/components/Cron";
import { BotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotScheduleFormMap {
    runningType?: BotSchedule.ERunningType;
    startAt?: Date;
    endAt?: Date;
    interval?: string;
    scopeType?: BotSchedule.TTargetTable;
    scopeUID?: string;
}

export interface IBotScheduleTriggersMap {
    startAt?: HTMLButtonElement | null;
    endAt?: HTMLButtonElement | null;
    scopeType?: HTMLButtonElement | null;
    scopeUID?: HTMLButtonElement | null;
}

export interface IBoardSettingsCronBotScheduleFormProps {
    initialValuesMap?: IBotScheduleFormMap;
    valuesMapRef: React.RefObject<IBotScheduleFormMap>;
    triggersMapRef: React.RefObject<IBotScheduleTriggersMap>;
    disabled?: bool;
}

function BoardSettingsCronBotScheduleForm({
    initialValuesMap,
    valuesMapRef,
    triggersMapRef,
    disabled,
}: IBoardSettingsCronBotScheduleFormProps): JSX.Element {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const columns = ProjectColumn.Model.useModels((model) => model.project_uid === project.uid);
    const cards = ProjectCard.Model.useModels((model) => model.project_uid === project.uid);
    const [runningType, setRunningType] = useState<BotSchedule.ERunningType>(initialValuesMap?.runningType ?? BotSchedule.ERunningType.Infinite);
    const [startAt, setStartAt] = useState<Date | undefined>(initialValuesMap?.startAt);
    const [endAt, setEndAt] = useState<Date | undefined>(initialValuesMap?.endAt);
    const [scopeType, setScopeType] = useState<BotSchedule.TTargetTable | undefined>(initialValuesMap?.scopeType);
    const [scopeUID, setScopeUID] = useState<string>(initialValuesMap?.scopeUID ?? "");
    const [ScopeItem, scopeItems] = useMemo(() => {
        if (scopeType === "project_column") {
            return [BoardSettingsCronBotScheduleColumnScopeItem, columns];
        } else if (scopeType === "card") {
            return [BoardSettingsCronBotScheduleCardScopeItem, cards];
        }
        return [undefined, []];
    }, [scopeType, columns, cards]);
    const onClickSetDateTime = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            const pickerType = e.currentTarget.getAttribute("data-picker-type");
            if (pickerType !== "end") {
                return;
            }

            if (!startAt) {
                e.preventDefault();
                e.stopPropagation();
                triggersMapRef.current.startAt?.click();
            }
        },
        [startAt, endAt]
    );

    const onChangeRunningType = (value: BotSchedule.ERunningType) => {
        setRunningType(value as BotSchedule.ERunningType);
        valuesMapRef.current.runningType = value as BotSchedule.ERunningType;
        const now = new Date();

        if (BotSchedule.RUNNING_TYPES_WITH_START_AT.includes(value)) {
            valuesMapRef.current.startAt = new Date(now.setMinutes(now.getMinutes() + 30));
        } else {
            valuesMapRef.current.startAt = undefined;
        }

        if (BotSchedule.RUNNING_TYPES_WITH_END_AT.includes(value)) {
            valuesMapRef.current.endAt = new Date(now.setMinutes(now.getMinutes() + 31));
        } else {
            valuesMapRef.current.endAt = undefined;
        }

        valuesMapRef.current.startAt?.setSeconds(0);
        valuesMapRef.current.endAt?.setSeconds(0);

        setStartAt(valuesMapRef.current.startAt);
        setEndAt(valuesMapRef.current.endAt);
    };

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
            <Select.Root value={runningType} onValueChange={onChangeRunningType} disabled={disabled}>
                <Select.Trigger className="w-full">
                    <Select.Value placeholder={t("project.settings.Select running type")} />
                </Select.Trigger>
                <Select.Content>
                    {Object.keys(BotSchedule.ERunningType).map((type) => {
                        const runningType = BotSchedule.ERunningType[type];
                        return (
                            <Select.Item key={runningType} value={runningType}>
                                {t(`project.settings.cronRunningTypes.${runningType}`)}
                            </Select.Item>
                        );
                    })}
                </Select.Content>
            </Select.Root>
            {BotSchedule.RUNNING_TYPES_WITH_START_AT.includes(runningType) && (
                <DateTimePicker
                    value={startAt}
                    min={new Date(new Date().setMinutes(new Date().getMinutes() + 30))}
                    onChange={(date) => {
                        date?.setSeconds(0);
                        setStartAt(date);
                        if (valuesMapRef.current.endAt && valuesMapRef.current.endAt.getTime() < (date?.getTime() ?? 0)) {
                            setEndAt(date ? new Date(date.getTime() + 60 * 1000) : undefined);
                        }
                        setTimeout(() => {
                            if (BotSchedule.RUNNING_TYPES_WITH_END_AT.includes(runningType)) {
                                triggersMapRef.current.endAt?.click();
                            }
                        }, 0);
                        valuesMapRef.current.startAt = date;
                        if (valuesMapRef.current.endAt && valuesMapRef.current.endAt.getTime() < (date?.getTime() ?? 0)) {
                            valuesMapRef.current.endAt = date ? new Date(date.getTime() + 60 * 1000) : undefined;
                        }
                    }}
                    timePicker={{
                        hour: true,
                        minute: true,
                        second: false,
                    }}
                    renderTrigger={() => (
                        <Button
                            type="button"
                            variant={startAt ? "default" : "outline"}
                            className={cn("h-8 gap-2 px-3 lg:h-10", startAt && "rounded-r-none")}
                            title={t("project.settings.Set start time")}
                            data-picker-type="start"
                            onClick={onClickSetDateTime}
                            ref={(elem) => {
                                triggersMapRef.current.startAt = elem;
                            }}
                        >
                            <IconComponent icon="calendar" size="4" />
                            {startAt?.toLocaleString() ?? t("project.settings.Set start time")}
                        </Button>
                    )}
                />
            )}
            {BotSchedule.RUNNING_TYPES_WITH_END_AT.includes(runningType) && (
                <DateTimePicker
                    value={endAt}
                    min={startAt ? new Date(startAt!.getTime() + 60 * 1000) : undefined}
                    onChange={(date) => {
                        date?.setSeconds(0);
                        setEndAt(date);
                        valuesMapRef.current.endAt = date;
                    }}
                    timePicker={{
                        hour: true,
                        minute: true,
                        second: false,
                    }}
                    renderTrigger={() => (
                        <Button
                            type="button"
                            variant={endAt ? "default" : "outline"}
                            className={cn("h-8 gap-2 px-3 lg:h-10", endAt && "rounded-r-none")}
                            title={t("project.settings.Set end time")}
                            data-picker-type="end"
                            onClick={onClickSetDateTime}
                            ref={(elem) => {
                                triggersMapRef.current.endAt = elem;
                            }}
                        >
                            <IconComponent icon="calendar" size="4" />
                            {endAt?.toLocaleString() ?? t("project.settings.Set end time")}
                        </Button>
                    )}
                />
            )}
            <Select.Root value={scopeType} onValueChange={onChangeScopeType} disabled={disabled}>
                <Select.Trigger
                    className="w-full"
                    ref={(elem) => {
                        triggersMapRef.current.scopeType = elem;
                    }}
                >
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
                    <Select.Trigger
                        className="w-full"
                        ref={(elem) => {
                            triggersMapRef.current.scopeUID = elem;
                        }}
                    >
                        <Select.Value placeholder={t("project.settings.Select scope")} />
                    </Select.Trigger>
                    <Select.Content>
                        {!!scopeItems.length && ScopeItem && scopeItems.map((item) => <ScopeItem key={item.uid} item={item as any} />)}
                    </Select.Content>
                </Select.Root>
            )}
            <Cron value={initialValuesMap?.interval ?? "@reboot"} setValue={onChangeCron} disabled={disabled} readOnly={disabled} />
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

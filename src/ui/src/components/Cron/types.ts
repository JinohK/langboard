import { Dispatch, SetStateAction } from "react";

// External props

export interface CronProps {
    /**
     * Cron value, the component is by design a controlled component.
     * The first value will be the default value.
     *
     * required
     */
    value: string;

    /**
     * Set the cron value, similar to onChange.
     * The naming tells you that you have to set the value by yourself.
     *
     * required
     */
    setValue: SetValue;

    /**
     * Set the container className and used as a prefix for other selectors.
     * Available selectors: https://xrutayisire.github.io/react-js-cron/?path=/story/reactjs-cron--custom-style
     */
    className?: string;

    /**
     * Humanize the labels in the cron component, SUN-SAT and JAN-DEC.
     *
     * Default: true
     */
    humanizeLabels?: bool;

    /**
     * Humanize the value, SUN-SAT and JAN-DEC.
     *
     * Default: false
     */
    humanizeValue?: bool;

    /**
     * Add a "0" before numbers lower than 10.
     *
     * Default: false
     */
    leadingZero?: LeadingZero;

    /**
     * Define the default period when the default value is empty.
     *
     * Default: 'day'
     */
    defaultPeriod?: PeriodType;

    /**
     * Disable the cron component.
     *
     * Default: false
     */
    disabled?: bool;

    /**
     * Make the cron component read-only.
     *
     * Default: false
     */
    readOnly?: bool;

    /**
     * Define if empty should trigger an error.
     *
     * Default: 'for-default-value'
     */
    allowEmpty?: AllowEmpty;

    /**
     * Support cron shortcuts.
     *
     * Default: ['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly']
     */
    shortcuts?: Shortcuts;

    /**
     * Define the clock format.
     *
     * Default: undefined
     */
    clockFormat?: ClockFormat;

    /**
     * Triggered when the cron component detects an error with the value.
     */
    onError?: OnError;

    /**
     * Define if a double click on a dropdown option should automatically
     * select / unselect a periodicity.
     *
     * Default: true
     */
    periodicityOnDoubleClick?: bool;

    /**
     * Define if it's possible to select only one or multiple values for each dropdowns.
     *
     * Even in single mode, if you want to disable the double click on a dropdown option that
     * automatically select / unselect a periodicity, set 'periodicityOnDoubleClick'
     * prop at false.
     *
     * When single mode is active and 'periodicityOnDoubleClick' is false,
     * each dropdown will automatically close after selecting a value
     *
     * Default: 'multiple'
     */
    mode?: Mode;

    /**
     * Define which dropdowns need to be displayed.
     *
     * Default: ['period', 'months', 'month-days', 'week-days', 'hours', 'minutes']
     */
    allowedDropdowns?: CronType[];

    /**
     * Define the list of periods available.
     *
     * Default: ['year', 'month', 'week', 'day', 'hour', 'minute', 'reboot']
     */
    allowedPeriods?: PeriodType[];

    /**
     * Define specific configuration that is used for each dropdown specifically.
     * Configuring a dropdown will override any global configuration for the same property.
     *
     * Configuration available:
     *
     * // See global configuration
     * // For 'months' and 'week-days'
     * humanizeLabels?: bool
     *
     * // See global configuration
     * // For 'months' and 'week-days'
     * humanizeValue?: bool
     *
     * // See global configuration
     * // For 'month-days', 'hours' and 'minutes'
     * leadingZero?: bool
     *
     * // See global configuration
     * For 'period', 'months', 'month-days', 'week-days', 'hours' and 'minutes'
     * disabled?: bool
     *
     * // See global configuration
     * For 'period', 'months', 'month-days', 'week-days', 'hours' and 'minutes'
     * readOnly?: bool
     *
     * // See global configuration
     * // For 'months', 'month-days', 'week-days', 'hours' and 'minutes'
     * periodicityOnDoubleClick?: bool
     *
     * // See global configuration
     * // For 'months', 'month-days', 'week-days', 'hours' and 'minutes'
     * mode?: Mode
     *
     * // The function will receive one argument, an object with value and label.
     * // If the function returns true, the option will be included in the filtered set.
     * // Otherwise, it will be excluded.
     * // For 'months', 'month-days', 'week-days', 'hours' and 'minutes'
     * filterOption?: FilterOption
     *
     * Default: undefined
     */
    dropdownsConfig?: DropdownsConfig;

    useClearButton?: bool;
}
export type SetValueFunction = (value: string, extra: SetValueFunctionExtra) => void;
export interface SetValueFunctionExtra {
    selectedPeriod: PeriodType;
}
export type SetValue = SetValueFunction | Dispatch<SetStateAction<string>>;
export type CronError =
    | {
          type: "invalid_cron";
          description: string;
      }
    | undefined;
export type OnErrorFunction = (error: CronError) => void;
export type OnError = OnErrorFunction | Dispatch<SetStateAction<CronError>> | undefined;
export type PeriodType = "year" | "month" | "week" | "day" | "hour" | "minute" | "reboot";
export type AllowEmpty = "always" | "never" | "for-default-value";
export type CronType = "period" | "months" | "month-days" | "week-days" | "hours" | "minutes";
export type LeadingZeroType = "month-days" | "hours" | "minutes";
export type LeadingZero = bool | LeadingZeroType[];
export type ClockFormat = "24-hour-clock" | "12-hour-clock";
export type ShortcutsType = "@yearly" | "@annually" | "@monthly" | "@weekly" | "@daily" | "@midnight" | "@hourly" | "@reboot";
export type Shortcuts = bool | ShortcutsType[];
export type Mode = "multiple" | "single";
export type DropdownConfig = {
    humanizeLabels?: bool;
    humanizeValue?: bool;
    leadingZero?: bool;
    disabled?: bool;
    readOnly?: bool;
    periodicityOnDoubleClick?: bool;
    mode?: Mode;
    filterOption?: FilterOption;
};
export type DropdownsConfig = {
    period?: Pick<DropdownConfig, "disabled" | "readOnly">;
    months?: Omit<DropdownConfig, "leadingZero">;
    "month-days"?: Omit<DropdownConfig, "humanizeLabels" | "humanizeValue">;
    "week-days"?: Omit<DropdownConfig, "leadingZero">;
    hours?: Omit<DropdownConfig, "humanizeLabels" | "humanizeValue">;
    minutes?: Omit<DropdownConfig, "humanizeLabels" | "humanizeValue">;
};

// Internal props

export interface FieldProps {
    value?: number[];
    setValue: SetValueNumbersOrUndefined;
    className?: string;
    disabled: bool;
    readOnly: bool;
    period: PeriodType;
    periodicityOnDoubleClick: bool;
    mode: Mode;
    filterOption?: FilterOption;
}
export interface PeriodProps extends Omit<FieldProps, "value" | "setValue" | "period" | "periodicityOnDoubleClick" | "mode" | "filterOption"> {
    value: PeriodType;
    setValue: SetValuePeriod;
    shortcuts: Shortcuts;
    allowedPeriods: PeriodType[];
}
export interface MonthsProps extends FieldProps {
    humanizeLabels: bool;
}
export interface MonthDaysProps extends FieldProps {
    weekDays?: number[];
    leadingZero: LeadingZero;
}
export interface WeekDaysProps extends FieldProps {
    humanizeLabels: bool;
    monthDays?: number[];
}
export interface HoursProps extends FieldProps {
    leadingZero: LeadingZero;
    clockFormat?: ClockFormat;
}
export interface MinutesProps extends FieldProps {
    leadingZero: LeadingZero;
    clockFormat?: ClockFormat;
}
export interface CustomSelectProps extends FieldProps {
    placeholder?: string;
    optionsList?: string[];
    humanizeLabels?: bool;
    leadingZero?: LeadingZero;
    clockFormat?: ClockFormat;
    unit: Unit;
}
export type SetValueNumbersOrUndefined = Dispatch<SetStateAction<number[] | undefined>>;
export type SetValuePeriod = Dispatch<SetStateAction<PeriodType | undefined>>;
export interface Classes {
    [key: string]: bool;
}
export interface ShortcutsValues {
    name: ShortcutsType;
    value: string;
}
export interface Unit {
    type: CronType;
    min: number;
    max: number;
    total: number;
    alt?: string[];
}
export interface Clicks {
    time: number;
    value: number;
}

export type FilterOption = ({ value, label }: { value: string; label: string }) => bool;

/**
 * Shadcn Datetime Picker with support for timezone, date and time selection, minimum and maximum date limits, and 12-hour format...
 * Check out the live demo at https://shadcn-datetime-picker-pro.vercel.app/
 * Find the latest source code at https://github.com/huybuidac/shadcn-datetime-picker
 */
"use client";

import * as React from "react";
import { useState } from "react";
import * as Popover from "@/components/base/Popover";
import Calendar, { ICalendarProps } from "@/components/base/Calendar";

export interface IDateTimePickerProps extends ICalendarProps {
    renderTrigger: (props: DateTimeRenderTriggerProps) => React.ReactNode;
}

export type DateTimeRenderTriggerProps = {
    open: bool;
    timezone?: string;
    disabled?: bool;
    use12HourFormat?: bool;
    setOpen: (open: bool) => void;
};

function DateTimePicker({ renderTrigger, onChange, ...props }: IDateTimePickerProps): JSX.Element {
    const { timezone, disabled, use12HourFormat } = props;
    const [open, setOpen] = useState(false);

    const handleChange = (date: Date | undefined) => {
        onChange(date);
        setOpen(false);
    };

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>{renderTrigger({ open, timezone, disabled, use12HourFormat, setOpen })}</Popover.Trigger>
            <Popover.Content className="w-auto p-2">
                <Calendar onChange={handleChange} {...props} />
            </Popover.Content>
        </Popover.Root>
    );
}

export default DateTimePicker;

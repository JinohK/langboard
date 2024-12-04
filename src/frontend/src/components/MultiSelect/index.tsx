/* eslint-disable @/max-len */
"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Badge, Command, Flex, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";

export interface IMultiSelectItem {
    label: string;
    value: string;
}

export interface IMultiSelectProps {
    selections: IMultiSelectItem[];
    placeholder?: string;
    selectedState: [string[], React.Dispatch<React.SetStateAction<string[]>>];
    className?: string;
    badgeClassName?: string;
    inputClassName?: string;
    createBadgeWrapper?: (badge: JSX.Element, value: string) => JSX.Element;
}

const MultiSelect = React.memo(
    ({ selections, placeholder, selectedState, className, badgeClassName, inputClassName, createBadgeWrapper }: IMultiSelectProps) => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [open, setOpen] = React.useState(false);
        const [selected, setSelected] = selectedState;
        const selectables = React.useMemo(() => selections.filter((selection) => !selected.includes(selection.value)), [selections, selected]);
        const [inputValue, setInputValue] = React.useState("");

        const handleUnselect = React.useCallback((item: string) => {
            setSelected((prev) => prev.filter((selected) => selected !== item));
        }, []);

        const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current;
            if (!input) {
                return;
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                if (input.value === "") {
                    setSelected((prev) => {
                        const newSelected = [...prev];
                        newSelected.pop();
                        return newSelected;
                    });
                }
            }

            if (e.key === "Escape") {
                input.blur();
            }
        }, []);

        return (
            <Command.Root onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent", className)}>
                <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                    <Flex wrap="wrap" gap="1">
                        {selected.map((selectedValue) => {
                            const selection = selections.find((selection) => selection.value === selectedValue)!;
                            let badge = (
                                <Badge variant="secondary" className={cn("justify-between gap-1 pl-2 pr-1", badgeClassName)}>
                                    {selection.label}
                                    <button
                                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleUnselect(selectedValue);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleUnselect(selectedValue)}
                                    >
                                        <IconComponent icon="x" size="3" className="text-muted-foreground transition-all hover:text-foreground" />
                                    </button>
                                </Badge>
                            );

                            if (createBadgeWrapper) {
                                badge = createBadgeWrapper(badge, selectedValue);
                            }

                            return (
                                <span key={selection.value} className="inline-flex">
                                    {badge}
                                </span>
                            );
                        })}
                        <CommandPrimitive.Input
                            ref={inputRef}
                            value={inputValue}
                            onValueChange={setInputValue}
                            onBlur={() => setOpen(false)}
                            onFocus={() => setOpen(true)}
                            placeholder={placeholder}
                            className={cn("ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground", inputClassName)}
                        />
                    </Flex>
                </div>
                <div className="relative mt-2">
                    <Command.List>
                        {open && selectables.length > 0 ? (
                            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                                <Command.Group className="h-full overflow-auto">
                                    {selectables.map((selectable) => (
                                        <Command.Item
                                            key={selectable.value}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onSelect={() => {
                                                setInputValue("");
                                                setSelected((prev) => [...prev, selectable.value]);
                                            }}
                                            className={"cursor-pointer"}
                                        >
                                            {selectable.label}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            </div>
                        ) : null}
                    </Command.List>
                </div>
            </Command.Root>
        );
    }
);

export default MultiSelect;

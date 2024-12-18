/* eslint-disable @/max-len */
"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Badge, Box, Command, Flex, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { useFloating, autoUpdate, offset, shift, limitShift, hide, flip, size } from "@floating-ui/react-dom";

export interface IMultiSelectItem {
    label: string;
    value: string;
}

interface IBaseMultiSelectProps {
    selections: IMultiSelectItem[];
    placeholder?: string;
    selectedValue?: string[];
    onValueChange?: (value: string[]) => void;
    className?: string;
    badgeClassName?: string;
    inputClassName?: string;
    createBadgeWrapper?: (badge: JSX.Element, value: string) => JSX.Element;
    canCreateNew?: bool;
    validateCreatedNewValue?: (value: string) => bool;
    commandItemForNew?: (value: string) => string;
    disabled?: bool;
}

interface IAllowingCreateNewMultiSelectProps extends IBaseMultiSelectProps {
    canCreateNew: true;
    validateCreatedNewValue: (value: string) => bool;
    commandItemForNew?: (value: string) => string;
}

interface IDefaultMultiSelectProps extends IBaseMultiSelectProps {
    canCreateNew?: false;
    validateCreatedNewValue?: never;
    commandItemForNew?: never;
}

export type TMultiSelectProps = IAllowingCreateNewMultiSelectProps | IDefaultMultiSelectProps;

const MultiSelect = React.memo(
    ({
        selections,
        placeholder,
        selectedValue,
        onValueChange,
        className,
        badgeClassName,
        inputClassName,
        createBadgeWrapper,
        canCreateNew,
        validateCreatedNewValue,
        commandItemForNew,
        disabled,
    }: TMultiSelectProps) => {
        const [wrapper, setWrapper] = React.useState<HTMLDivElement | null>(null);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [open, setOpen] = React.useState(false);
        const [selected, setSelected] = React.useState(selectedValue ?? []);
        const selectables = React.useMemo(
            () => selections.filter((selection) => !selected.includes(selection.value)),
            [selections, selectedValue, selected]
        );
        const [inputValue, setInputValue] = React.useState("");
        const handleUnselect = React.useCallback((item: string) => {
            setSelected((prev) => prev.filter((selected) => selected !== item));
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
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

        React.useEffect(() => {
            if (onValueChange) {
                onValueChange(selected);
            }
        }, [selected]);

        React.useEffect(() => {
            if (selectedValue) {
                setSelected(selectedValue);
            }
        }, [selectedValue]);

        const boundary: (Element | null)[] = [];
        const hasExplicitBoundaries = boundary.length > 0;

        const detectOverflowOptions = {
            padding: 0,
            boundary: boundary.filter((value: Element | null) => value !== null),
            altBoundary: hasExplicitBoundaries,
        };

        const { refs, floatingStyles, isPositioned, middlewareData } = useFloating({
            strategy: "absolute",
            placement: "bottom",
            whileElementsMounted: (...args) => {
                const cleanup = autoUpdate(...args, {
                    animationFrame: false,
                });
                return cleanup;
            },
            elements: {
                reference: wrapper,
            },
            middleware: [
                offset({ mainAxis: 0, alignmentAxis: 0 }),
                shift({
                    mainAxis: true,
                    crossAxis: false,
                    limiter: limitShift(),
                    ...detectOverflowOptions,
                }),
                flip({ ...detectOverflowOptions }),
                size({
                    ...detectOverflowOptions,
                    apply: ({ elements, availableWidth, availableHeight }) => {
                        const contentStyle = elements.floating.style;
                        contentStyle.setProperty("--multiselect-available-width", `${availableWidth}px`);
                        contentStyle.setProperty("--multiselect-available-height", `${availableHeight}px`);
                    },
                }),
                hide({ strategy: "referenceHidden", ...detectOverflowOptions }),
            ],
        });

        const style = {
            ...floatingStyles,
            transform: isPositioned ? floatingStyles.transform : "translate(0, -200%)",
            "--multiselect-transform-origin": [middlewareData.transformOrigin?.x, middlewareData.transformOrigin?.y].join(" "),
        };

        const isDisabled = (!canCreateNew && !selectables.length) || !!disabled;
        const isCreatable = canCreateNew && inputValue && validateCreatedNewValue && validateCreatedNewValue(inputValue);

        return (
            <Command.Root onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent", className)}>
                <Box
                    px="3"
                    py="2"
                    textSize="sm"
                    border
                    rounded="md"
                    className="group border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0"
                    ref={setWrapper}
                >
                    <Flex wrap="wrap" gap="1">
                        {selected.map((selectedValue) => {
                            let selection = selections.find((selection) => selection.value === selectedValue);
                            if (!selection && canCreateNew) {
                                selection = { label: selectedValue, value: selectedValue };
                            }

                            let badge = (
                                <Badge variant="secondary" className={cn("justify-between gap-1 pl-2 pr-1", badgeClassName)}>
                                    {selection!.label}
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
                                        disabled={disabled}
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
                                <span key={selection!.value} className="inline-flex">
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
                            disabled={isDisabled}
                            className={cn("ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground", inputClassName)}
                        />
                    </Flex>
                </Box>
                <Box position="relative" mt="2">
                    <Command.List
                        style={style}
                        className={cn(
                            "absolute z-50 w-full min-w-max bg-popover text-popover-foreground shadow-md transition-[height]",
                            "max-h-[calc(min(var(--multiselect-available-height)_-_theme(spacing.4),350px))]",
                            "[&>[cmdk-list-sizer]]:w-full",
                            !open || isDisabled ? "hidden" : "rounded-md border",
                            middlewareData.hide?.referenceHidden && "pointer-events-none invisible"
                        )}
                        ref={refs.setFloating}
                    >
                        {open && (selectables.length > 0 || isCreatable) ? (
                            <Box w="full" className="outline-none animate-in">
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
                                            disabled={disabled}
                                            className={"cursor-pointer"}
                                        >
                                            {selectable.label}
                                        </Command.Item>
                                    ))}
                                    {isCreatable && (
                                        <Command.Item
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onSelect={() => {
                                                setInputValue("");
                                                setSelected((prev) => [...prev, inputValue]);
                                            }}
                                            disabled={disabled}
                                            className={"cursor-pointer"}
                                        >
                                            {commandItemForNew ? commandItemForNew(inputValue) : inputValue}
                                        </Command.Item>
                                    )}
                                </Command.Group>
                            </Box>
                        ) : null}
                    </Command.List>
                </Box>
            </Command.Root>
        );
    }
);

export default MultiSelect;

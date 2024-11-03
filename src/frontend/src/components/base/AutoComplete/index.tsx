import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import * as Command from "@/components/base/Command";
import Input from "@/components/base/Input";
import * as Popover from "@/components/base/Popover";
import Skeleton from "@/components/base/Skeleton";
import { cn } from "@/core/utils/ComponentUtils";

type Props = {
    selectedValue: string;
    onValueChange: (value: string) => void;
    items: { value: string; label: string }[];
    isLoading?: bool;
    emptyMessage: string;
    placeholder: string;
};

function AutoComplete({ selectedValue, onValueChange, items, isLoading, emptyMessage, placeholder }: Props) {
    const [open, setOpen] = useState(false);
    const [currentValue, setCurrentValue] = useState(selectedValue);

    const labels = useMemo(
        () =>
            items.reduce(
                (acc, item) => {
                    acc[item.value] = item.label;
                    return acc;
                },
                {} as Record<string, string>
            ),
        [items]
    );

    const changeValue = (inputValue: string) => {
        onValueChange(inputValue);
        setCurrentValue(inputValue);
    };

    const onSelectItem = (inputValue: string) => {
        changeValue(inputValue);
        setOpen(false);
    };

    return (
        <div className="flex items-center">
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Command.Root
                    shouldFilter={false}
                    onKeyDown={(e) => {
                        if (!open) {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                >
                    <Popover.Trigger asChild>
                        <CommandPrimitive.Input
                            asChild
                            value={labels[currentValue] ?? currentValue}
                            onValueChange={changeValue}
                            onKeyDown={(e) => {
                                if (e.key !== "Escape") {
                                    if (!open) {
                                        setOpen(true);
                                    }
                                    return;
                                }

                                setOpen(false);
                            }}
                        >
                            <Input placeholder={placeholder} />
                        </CommandPrimitive.Input>
                    </Popover.Trigger>
                    {!open && <Command.List aria-hidden="true" className="hidden" />}
                    <Popover.Content
                        asChild
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            if (e.target instanceof Element && e.target.hasAttribute("cmdk-input")) {
                                e.preventDefault();
                            }
                        }}
                        className="w-[--radix-popover-trigger-width] p-0"
                    >
                        <Command.List>
                            {isLoading && (
                                <CommandPrimitive.Loading>
                                    <div className="p-1">
                                        <Skeleton className="h-6 w-full" />
                                    </div>
                                </CommandPrimitive.Loading>
                            )}
                            {items.length > 0 && !isLoading ? (
                                <Command.Group>
                                    {items.map((option) => (
                                        <Command.Item
                                            key={option.value}
                                            value={option.value}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onSelect={onSelectItem}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", currentValue === option.value ? "opacity-100" : "opacity-0")} />
                                            {option.label}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            ) : null}
                            {!isLoading ? <Command.Empty>{emptyMessage ?? "No items."}</Command.Empty> : null}
                        </Command.List>
                    </Popover.Content>
                </Command.Root>
            </Popover.Root>
        </div>
    );
}

export default AutoComplete;

/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @/max-len */
"use client";

import * as React from "react";
import { isEqualTags } from "@platejs/tag";
import { MultiSelectPlugin, TagPlugin, useSelectableItems, useSelectEditorCombobox } from "@platejs/tag/react";
import { Command as CommandPrimitive, useCommandActions } from "@udecode/cmdk";
import { Fzf } from "fzf";
import { PlusIcon } from "lucide-react";
import { isHotkey, KEYS, TTagElement } from "platejs";
import { Plate, useEditorContainerRef, useEditorRef, usePlateEditor } from "platejs/react";
import { Popover } from "@/components/base";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { TagElement } from "@/components/plate-ui/tag-node";
import { Trans } from "react-i18next";
import { cn, withProps } from "@/core/utils/ComponentUtils";

export type TSelectItem = {
    value: string;
    isNew?: bool;
    label?: string;
    keywords?: string[];
};

type SelectEditorContextValue = {
    items: TSelectItem[];
    open: bool;
    setOpen: (open: bool) => void;
    defaultValue?: TSelectItem[];
    value?: TSelectItem[];
    onValueChange?: (items: TSelectItem[]) => void;
    createTagContent?: (props: TSelectItem & { readOnly: bool }) => JSX.Element;
    canAddNew: bool;
    validateNewItem?: (value: string) => bool;
    createNewItemLabel?: (item: TSelectItem) => React.ReactNode;
};

const SelectEditorContext = React.createContext<SelectEditorContextValue | undefined>(undefined);

const useSelectEditorContext = () => {
    const context = React.useContext(SelectEditorContext);

    if (!context) {
        throw new Error("useSelectEditor must be used within SelectEditor");
    }

    return context;
};

export interface ISelectEditorProviderProps {
    children: React.ReactNode;
    defaultValue?: TSelectItem[];
    items?: TSelectItem[];
    value?: TSelectItem[];
    onValueChange?: (items: TSelectItem[]) => void;
    createTagContent?: (props: TSelectItem & { readOnly: bool }) => JSX.Element;
    canAddNew?: bool;
    validateNewItem?: (value: string) => bool;
    createNewItemLabel?: (item: TSelectItem) => string;
}

export function SelectEditor({
    children,
    defaultValue,
    items = [],
    value,
    onValueChange,
    createTagContent,
    canAddNew = false,
    validateNewItem,
    createNewItemLabel,
}: ISelectEditorProviderProps) {
    const [open, setOpen] = React.useState(false);
    const [internalValue] = React.useState(defaultValue);

    return (
        <SelectEditorContext.Provider
            value={{
                items,
                open,
                setOpen,
                value: value ?? internalValue,
                onValueChange,
                createTagContent,
                canAddNew,
                validateNewItem,
                createNewItemLabel,
            }}
        >
            <Command className="has-data-readonly:w-fit overflow-visible bg-transparent" shouldFilter={false} loop>
                {children}
            </Command>
        </SelectEditorContext.Provider>
    );
}

export function SelectEditorContent({ children }: { children: React.ReactNode }) {
    const { value, createTagContent, onValueChange } = useSelectEditorContext();
    const { setSearch } = useCommandActions();
    const itemRemovedCallback = React.useCallback(
        (item: TTagElement) => {
            onValueChange?.(value?.filter((v) => v.value !== item.value) ?? []);
        },
        [value, onValueChange]
    );

    const editor = usePlateEditor(
        {
            plugins: [MultiSelectPlugin.withComponent(withProps(TagElement, { createTagContent, itemRemovedCallback }))],
            value: createEditorValue(value),
        },
        []
    );

    React.useEffect(() => {
        if (!isEqualTags(editor, value)) {
            editor.tf.replaceNodes(createEditorValue(value), {
                at: [],
                children: true,
            });
        }
    }, [editor, value]);

    return (
        <Plate
            onValueChange={({ editor }) => {
                setSearch(editor.api.string([]));
            }}
            editor={editor}
        >
            <EditorContainer variant="select">{children}</EditorContainer>
        </Plate>
    );
}

export const SelectEditorInput = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Editor>>((props, ref) => {
    const editor = useEditorRef();
    const { setOpen } = useSelectEditorContext();
    const { selectCurrentItem, selectFirstItem } = useCommandActions();

    React.useEffect(() => {
        if (props.readOnly) {
            setOpen(false);
        }
    }, [props.readOnly]);

    return (
        <Editor
            ref={ref}
            variant="select"
            onBlur={() => setOpen(false)}
            onFocusCapture={() => {
                if (props.readOnly) {
                    return;
                }

                setOpen(true);
                selectFirstItem();
            }}
            onKeyDown={(e) => {
                if (isHotkey("enter", e)) {
                    e.preventDefault();
                    selectCurrentItem();
                    editor.tf.removeNodes({ at: [], empty: false, text: true });
                }
                if (isHotkey("escape", e) || isHotkey("mod+enter", e)) {
                    e.preventDefault();
                    e.currentTarget.blur();
                }
            }}
            autoFocusOnEditable
            {...props}
        />
    );
});

export function SelectEditorCombobox() {
    const editor = useEditorRef();
    const containerRef = useEditorContainerRef();
    const { items, open, onValueChange, canAddNew, validateNewItem, createNewItemLabel } = useSelectEditorContext();
    const fzfFilter = React.useMemo(() => createFzfFilter(items), [items]);
    const selectableItems = useSelectableItems({
        allowNew: canAddNew,
        filter: fzfFilter,
        items,
        newItemFilter: validateNewItem,
    });
    const { selectFirstItem } = useCommandActions();

    useSelectEditorCombobox({ open, selectFirstItem, onValueChange });

    if (!open || selectableItems.length === 0) return null;

    return (
        <Popover.Root open={open}>
            <Popover.Anchor virtualRef={containerRef as any} />
            <Popover.Content
                className="p-0"
                style={{
                    width: (containerRef.current?.offsetWidth ?? 0) + 8,
                }}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
                align="start"
                alignOffset={-4}
                sideOffset={8}
            >
                <CommandList>
                    <CommandGroup>
                        {selectableItems.map((item) =>
                            !canAddNew && item.isNew ? null : (
                                <CommandItem
                                    key={item.value}
                                    className="cursor-pointer gap-2"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onSelect={() => {
                                        editor.getTransforms(TagPlugin).insert.tag(item);
                                    }}
                                    keywords={item.keywords}
                                >
                                    {item.isNew ? (
                                        <div className="flex items-center gap-1">
                                            <PlusIcon className="size-4 text-foreground" />
                                            {createNewItemLabel ? (
                                                createNewItemLabel(item)
                                            ) : (
                                                <Trans
                                                    i18nKey={'common.Add "{value}"'}
                                                    values={{ value: item.value }}
                                                    components={{ highlight: <span className="text-gray-600" /> }}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        (item.label ?? item.value)
                                    )}
                                </CommandItem>
                            )
                        )}
                    </CommandGroup>
                </CommandList>
            </Popover.Content>
        </Popover.Root>
    );
}

const createEditorValue = (value?: TSelectItem[]) => [
    {
        children: [
            { text: "" },
            ...(value?.flatMap((item) => [
                {
                    children: [{ text: "" }],
                    type: KEYS.tag,
                    ...item,
                },
                {
                    text: "",
                },
            ]) ?? []),
        ],
        type: KEYS.p,
    },
];

const createFzfFilter = (items: TSelectItem[] = []) => {
    return (value: string, search: string): bool => {
        if (!search) return true;

        const item = items.find((item) => item.value === value);

        const fzf = new Fzf([value, ...(item?.keywords ?? [])], {
            casing: "case-insensitive",
            selector: (v: string) => v,
        });

        return fzf.find(search).length > 0;
    };
};

/**
 * You could replace this with import from '@/components/ui/command' + replace
 * 'cmdk' import with '@udecode/cmdk'
 */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)}
            data-slot="command"
            {...props}
        />
    );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
    return (
        <CommandPrimitive.List
            className={cn("max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden", className)}
            data-slot="command-list"
            {...props}
        />
    );
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            className={cn(
                "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
                className
            )}
            data-slot="command-group"
            {...props}
        />
    );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
    return (
        <CommandPrimitive.Item
            className={cn(
                "outline-hidden relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
                className
            )}
            data-slot="command-item"
            {...props}
        />
    );
}

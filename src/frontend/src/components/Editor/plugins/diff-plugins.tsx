/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlatePlugin } from "@udecode/plate";
import { type PlateLeafProps, PlateLeaf, toPlatePlugin } from "@udecode/plate/react";
import { type DiffOperation, DiffUpdate, withGetFragmentExcludeDiff } from "@udecode/plate-diff";
import { cn } from "@udecode/cn";

const diffOperationColors: Record<DiffOperation["type"], string> = {
    delete: "[&>*]:bg-destructive/70 [&_*]:line-through",
    insert: "[&>*]:bg-green-500/70 dark:[&>*]:bg-green-700/70",
    update: "[&>*]:bg-indigo-600/70 dark:[&>*]:bg-indigo-800/70",
};

const describeUpdate = ({ newProperties, properties }: DiffUpdate) => {
    const addedProps: string[] = [];
    const removedProps: string[] = [];
    const updatedProps: string[] = [];

    Object.keys(newProperties).forEach((key) => {
        const oldValue = properties[key];
        const newValue = newProperties[key];

        if (oldValue === undefined) {
            addedProps.push(key);

            return;
        }
        if (newValue === undefined) {
            removedProps.push(key);

            return;
        }

        updatedProps.push(key);
    });

    const descriptionParts = [];

    if (addedProps.length > 0) {
        descriptionParts.push(`Added ${addedProps.join(", ")}`);
    }
    if (removedProps.length > 0) {
        descriptionParts.push(`Removed ${removedProps.join(", ")}`);
    }
    if (updatedProps.length > 0) {
        updatedProps.forEach((key) => {
            descriptionParts.push(`Updated ${key} from ${properties[key]} to ${newProperties[key]}`);
        });
    }

    return descriptionParts.join("\n");
};

const DiffPlugin = toPlatePlugin(
    createSlatePlugin({
        key: "diff",
        node: { isLeaf: true },
    }).overrideEditor(withGetFragmentExcludeDiff),
    {
        render: {
            aboveNodes:
                () =>
                ({ children, editor, element }) => {
                    if (!element.diff) return children;

                    const diffOperation = element.diffOperation as DiffOperation;

                    const label = (
                        {
                            delete: "deletion",
                            insert: "insertion",
                            update: "update",
                        } as any
                    )[diffOperation.type];

                    const Component = editor.api.isInline(element) ? "span" : "div";

                    return (
                        <Component
                            className={cn(
                                diffOperationColors[diffOperation.type],
                                "[&_.slate-table]:py-0 [&_.slate-table_table]:ml-0 [&_.slate-table_table]:w-full [&_td]:bg-background/20"
                            )}
                            aria-label={label}
                        >
                            {children}
                        </Component>
                    );
                },
            node: DiffLeaf,
        },
    }
);

function DiffLeaf({ children, ...props }: PlateLeafProps) {
    const diffOperation = props.leaf.diffOperation as DiffOperation;

    const Component = (
        {
            delete: "del",
            insert: "ins",
            update: "span",
        } as any
    )[diffOperation.type];

    return (
        <PlateLeaf
            {...props}
            as={Component}
            className={diffOperationColors[diffOperation.type]}
            attributes={{
                ...props.attributes,
                title: diffOperation.type === "update" ? describeUpdate(diffOperation) : undefined,
            }}
        >
            <Component className={diffOperationColors[diffOperation.type]}>{children}</Component>
        </PlateLeaf>
    );
}

export const diffPlugins = [DiffPlugin];

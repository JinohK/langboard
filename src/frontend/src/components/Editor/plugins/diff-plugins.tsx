/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlatePlugin } from "@udecode/plate";
import { toPlatePlugin } from "@udecode/plate/react";
import { type PlateLeafProps, PlateLeaf } from "@udecode/plate/react";
import { type DiffOperation, withGetFragmentExcludeDiff } from "@udecode/plate-diff";
import { cn } from "@/core/utils/ComponentUtils";

const diffOperationColors: Record<DiffOperation["type"], string> = {
    delete: "[&>*]:bg-destructive/70 [&_*]:line-through",
    insert: "[&>*]:bg-green-500/70 dark:[&>*]:bg-green-700/70",
    update: "[&>*]:bg-indigo-600/70 dark:[&>*]:bg-indigo-800/70",
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
        <PlateLeaf {...props} asChild>
            <Component className={diffOperationColors[diffOperation.type]}>{children}</Component>
        </PlateLeaf>
    );
}

export const diffPlugins = [DiffPlugin];

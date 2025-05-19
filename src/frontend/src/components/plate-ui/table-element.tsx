/* eslint-disable @/max-len */
"use client";

import type { TTableElement } from "@udecode/plate-table";
import { cn } from "@udecode/cn";
import {
    PlateElement,
    PlateElementProps,
    useEditorPlugin,
    useEditorSelector,
    useElement,
    usePluginOption,
    useReadOnly,
    useRemoveNodeButton,
    useSelected,
    withHOC,
} from "@udecode/plate/react";
import { TablePlugin, TableProvider, useTableElement, useTableMergeState } from "@udecode/plate-table/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CombineIcon, SquareSplitHorizontalIcon, Trash2Icon, XIcon } from "lucide-react";
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/plate-ui/toolbar";
import { Popover } from "@/components/base";
import { useTranslation } from "react-i18next";
import { BlockSelectionPlugin } from "@udecode/plate-selection/react";

export const TableElement = withHOC(TableProvider, function TableElement({ children, ...props }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, "isSelectionAreaVisible");
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const selected = useSelected();
    const { isSelectingCell, marginLeft, props: tableProps } = useTableElement();

    const content = (
        <PlateElement
            {...props}
            className={cn("overflow-x-auto py-5", hasControls && "-ml-2 *:data-[slot=block-selection]:left-2")}
            style={{ paddingLeft: marginLeft }}
        >
            <div className="group/table relative w-fit">
                <table
                    className={cn(
                        "ml-px mr-0 table h-px table-fixed border-collapse",
                        "[&_tr:first-child_td]:bg-secondary/50 [&_tr:first-child_th]:bg-secondary/50",
                        isSelectingCell && "selection:bg-transparent"
                    )}
                    {...tableProps}
                >
                    <tbody className="min-w-full">{children}</tbody>
                </table>
            </div>
        </PlateElement>
    );

    if (readOnly || !selected) {
        return content;
    }

    return <TableFloatingToolbar>{content}</TableFloatingToolbar>;
});

export function TableFloatingToolbar({ children, ...props }: React.ComponentProps<typeof Popover.Content>) {
    const [t] = useTranslation();
    const { tf } = useEditorPlugin(TablePlugin);
    const element = useElement<TTableElement>();
    const { props: buttonProps } = useRemoveNodeButton({ element });
    const collapsed = useEditorSelector((editor) => !editor.api.isExpanded(), []);

    const { canMerge, canSplit } = useTableMergeState();

    return (
        <Popover.Root open={canMerge || canSplit || collapsed} modal={false}>
            <Popover.Anchor asChild>{children}</Popover.Anchor>
            <Popover.Content asChild onOpenAutoFocus={(e) => e.preventDefault()} contentEditable={false} {...props}>
                <Toolbar
                    className="flex w-auto max-w-[80vw] flex-row overflow-x-auto rounded-md border bg-popover p-1 shadow-md scrollbar-hide print:hidden"
                    contentEditable={false}
                >
                    <ToolbarGroup>
                        {canMerge && (
                            <ToolbarButton onClick={() => tf.table.merge()} onMouseDown={(e) => e.preventDefault()} tooltip={t("editor.Merge cells")}>
                                <CombineIcon className="size-4" />
                            </ToolbarButton>
                        )}
                        {canSplit && (
                            <ToolbarButton onClick={() => tf.table.split()} onMouseDown={(e) => e.preventDefault()} tooltip={t("editor.Split cells")}>
                                <SquareSplitHorizontalIcon className="size-4" />
                            </ToolbarButton>
                        )}

                        {collapsed && (
                            <>
                                <ToolbarGroup>
                                    <ToolbarButton tooltip={t("editor.Delete table")} {...buttonProps}>
                                        <Trash2Icon className="size-4" />
                                    </ToolbarButton>
                                </ToolbarGroup>
                            </>
                        )}
                    </ToolbarGroup>

                    {collapsed && (
                        <ToolbarGroup>
                            <ToolbarButton
                                onClick={() => {
                                    tf.insert.tableRow({ before: true });
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                tooltip={t("editor.Insert row before")}
                            >
                                <ArrowUp className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => {
                                    tf.insert.tableRow();
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                tooltip={t("editor.Insert row after")}
                            >
                                <ArrowDown className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => {
                                    tf.remove.tableRow();
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                tooltip={t("editor.Delete row")}
                            >
                                <XIcon className="size-4" />
                            </ToolbarButton>
                        </ToolbarGroup>
                    )}

                    {collapsed && (
                        <ToolbarGroup>
                            <ToolbarButton
                                onClick={() => {
                                    tf.insert.tableColumn({ before: true });
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                tooltip={t("editor.Insert column before")}
                            >
                                <ArrowLeft className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => {
                                    tf.insert.tableColumn();
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                tooltip={t("editor.Insert column after")}
                            >
                                <ArrowRight className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => {
                                    tf.remove.tableColumn();
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                tooltip={t("editor.Delete column")}
                            >
                                <XIcon className="size-4" />
                            </ToolbarButton>
                        </ToolbarGroup>
                    )}
                </Toolbar>
            </Popover.Content>
        </Popover.Root>
    );
}

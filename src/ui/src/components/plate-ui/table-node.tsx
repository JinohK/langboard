/* eslint-disable quotes */

/* eslint-disable @/max-len */
"use client";

import * as React from "react";
import { BlockSelectionPlugin, useBlockSelected } from "@platejs/selection/react";
import { TablePlugin, TableProvider, useTableCellElement, useTableElement, useTableMergeState } from "@platejs/table/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CombineIcon, SquareSplitHorizontalIcon, Trash2Icon, XIcon } from "lucide-react";
import { type TTableCellElement, type TTableElement, type TTableRowElement, KEYS } from "platejs";
import {
    type PlateElementProps,
    PlateElement,
    useEditorPlugin,
    useEditorSelector,
    useElement,
    usePluginOption,
    useReadOnly,
    useRemoveNodeButton,
    useSelected,
    withHOC,
} from "platejs/react";
import { useElementSelector } from "platejs/react";
import { Popover } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";
import { blockSelectionVariants } from "@/components/plate-ui/block-selection";
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const TableElement = withHOC(TableProvider, function TableElement({ children, ...props }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const { isSelectingCell, marginLeft, props: tableProps } = useTableElement();

    const isSelectingTable = useBlockSelected(props.element.id as string);

    const content = (
        <PlateElement {...props} className="-ml-2 overflow-x-auto py-5 *:data-[slot=block-selection]:left-2" style={{ paddingLeft: marginLeft }}>
            <div className="group/table relative w-fit">
                <table
                    className={cn("ml-2 mr-0 table h-px table-fixed border-collapse", isSelectingCell && "selection:bg-transparent")}
                    {...tableProps}
                >
                    <tbody className="min-w-full">{children}</tbody>
                </table>

                {isSelectingTable && <div className={blockSelectionVariants()} contentEditable={false} />}
            </div>
        </PlateElement>
    );

    if (readOnly) {
        return content;
    }

    return <TableFloatingToolbar>{content}</TableFloatingToolbar>;
});

function TableFloatingToolbar({ children, ...props }: React.ComponentProps<typeof Popover.Content>) {
    const [t] = useTranslation();
    const { tf } = useEditorPlugin(TablePlugin);
    const selected = useSelected();
    const element = useElement<TTableElement>();
    const { props: buttonProps } = useRemoveNodeButton({ element });
    const collapsedInside = useEditorSelector((editor) => selected && editor.api.isCollapsed(), [selected]);

    const { canMerge, canSplit } = useTableMergeState();

    return (
        <Popover.Root open={canMerge || canSplit || collapsedInside} modal={false}>
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
                        {collapsedInside && (
                            <ToolbarButton tooltip={t("editor.Delete table")} {...buttonProps}>
                                <Trash2Icon className="size-4" />
                            </ToolbarButton>
                        )}
                    </ToolbarGroup>

                    {collapsedInside && (
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

                    {collapsedInside && (
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

export function TableRowElement(props: PlateElementProps<TTableRowElement>) {
    const selected = useSelected();

    return (
        <PlateElement
            {...props}
            as="tr"
            className="group/row"
            attributes={{
                ...props.attributes,
                "data-selected": selected ? "true" : undefined,
            }}
        >
            {props.children}
        </PlateElement>
    );
}

export function TableCellElement({
    isHeader,
    ...props
}: PlateElementProps<TTableCellElement> & {
    isHeader?: boolean;
}) {
    const { api } = useEditorPlugin(TablePlugin);
    const readOnly = useReadOnly();
    const element = props.element;

    const rowId = useElementSelector(([node]) => node.id as string, [], {
        key: KEYS.tr,
    });
    const isSelectingRow = useBlockSelected(rowId);
    const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, "isSelectionAreaVisible");

    const { borders, colIndex, minHeight, selected, width } = useTableCellElement();

    return (
        <PlateElement
            {...props}
            as={isHeader ? "th" : "td"}
            className={cn(
                "h-full overflow-visible border-none bg-background p-0",
                element.background ? "bg-(--cellBackground)" : "bg-background",
                isHeader && "text-left *:m-0",
                "before:size-full",
                selected && "before:z-10 before:bg-brand/5",
                "before:absolute before:box-border before:select-none before:content-['']",
                borders.bottom?.size && "before:border-b before:border-b-border",
                borders.right?.size && "before:border-r before:border-r-border",
                borders.left?.size && "before:border-l before:border-l-border",
                borders.top?.size && "before:border-t before:border-t-border"
            )}
            style={
                {
                    "--cellBackground": element.background,
                    maxWidth: width || 240,
                    minWidth: width || 120,
                } as React.CSSProperties
            }
            attributes={{
                ...props.attributes,
                colSpan: api.table.getColSpan(element),
                rowSpan: api.table.getRowSpan(element),
            }}
        >
            <div className="relative z-20 box-border h-full px-3 py-2" style={{ minHeight }}>
                {props.children}
            </div>

            {!isSelectionAreaVisible && (
                <div className="group absolute top-0 size-full select-none" contentEditable={false} suppressContentEditableWarning={true}>
                    {!readOnly && (
                        <>
                            <div className={cn("absolute top-0 z-30 hidden h-full w-1 bg-ring", "right-[-1.5px]")} />
                            {colIndex === 0 && (
                                <div
                                    className={cn(
                                        "absolute top-0 z-30 h-full w-1 bg-ring",
                                        "left-[-1.5px]",
                                        'hidden animate-in fade-in group-has-[[data-resizer-left]:hover]/table:block group-has-[[data-resizer-left][data-resizing="true"]]/table:block'
                                    )}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {isSelectingRow && <div className={blockSelectionVariants()} contentEditable={false} />}
        </PlateElement>
    );
}

export function TableCellHeaderElement(props: React.ComponentProps<typeof TableCellElement>) {
    return <TableCellElement {...props} isHeader />;
}

"use client";

import { PopoverAnchor } from "@radix-ui/react-popover";
import { cn, withRef } from "@udecode/cn";
import { isSelectionExpanded } from "@udecode/plate-common";
import { useEditorRef, useEditorSelector, useElement, useRemoveNodeButton, withHOC } from "@udecode/plate-common/react";
import { type TTableElement, mergeTableCells, unmergeTableCells } from "@udecode/plate-table";
import { TableProvider, useTableElement, useTableElementState, useTableMergeState } from "@udecode/plate-table/react";
import { Combine, Trash2Icon, Ungroup } from "lucide-react";
import { useReadOnly, useSelected } from "slate-react";
import { PlateElement } from "@/components/plate-ui/plate-element";
import { Button, Popover } from "@/components/base";
import { useTranslation } from "react-i18next";

export const TableFloatingToolbar = withRef<typeof Popover.Content>(({ children, ...props }, ref) => {
    const [t] = useTranslation();
    const element = useElement<TTableElement>();
    const { props: buttonProps } = useRemoveNodeButton({ element });

    const selectionCollapsed = useEditorSelector((editor) => !isSelectionExpanded(editor), []);

    const readOnly = useReadOnly();
    const selected = useSelected();
    const editor = useEditorRef();

    const collapsed = !readOnly && selected && selectionCollapsed;
    const open = !readOnly && selected;

    const { canMerge, canUnmerge } = useTableMergeState();

    const mergeContent = canMerge && (
        <Button variant="ghost" onClick={() => mergeTableCells(editor)} contentEditable={false} isMenu>
            <Combine className="size-4" />
            {t("editor.Merge")}
        </Button>
    );

    const unmergeButton = canUnmerge && (
        <Button variant="ghost" onClick={() => unmergeTableCells(editor)} contentEditable={false} isMenu>
            <Ungroup className="size-4" />
            {t("editor.Unmerge")}
        </Button>
    );

    const bordersContent = collapsed && (
        <Button variant="ghost" contentEditable={false} isMenu {...buttonProps}>
            <Trash2Icon className="size-4" />
            {t("editor.Delete")}
        </Button>
    );

    return (
        <Popover.Root open={open} modal={false}>
            <PopoverAnchor asChild>{children}</PopoverAnchor>
            {(canMerge || canUnmerge || collapsed) && (
                <Popover.Content
                    ref={ref}
                    className={cn(Popover.ContentVariants(), "flex w-[220px] flex-col p-0")}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    {...props}
                >
                    {unmergeButton}
                    {mergeContent}
                    {bordersContent}
                </Popover.Content>
            )}
        </Popover.Root>
    );
});

export const TableElement = withHOC(
    TableProvider,
    withRef<typeof PlateElement>(({ children, className, ...props }, ref) => {
        const { colSizes, isSelectingCell, marginLeft, minColumnWidth } = useTableElementState();
        const { colGroupProps, props: tableProps } = useTableElement();

        return (
            <TableFloatingToolbar>
                <PlateElement className={cn(className, "overflow-x-auto")} style={{ paddingLeft: marginLeft }} {...props}>
                    <table
                        ref={ref}
                        className={cn(
                            "my-4 ml-px mr-0 table h-px w-[calc(100%-6px)] table-fixed border-collapse",
                            "[&_tr:first-child_td]:bg-secondary/50 [&_tr:first-child_th]:bg-secondary/50",
                            isSelectingCell && "[&_*::selection]:!bg-transparent"
                        )}
                        {...tableProps}
                    >
                        <colgroup {...colGroupProps}>
                            {colSizes.map((width, index) => (
                                <col
                                    key={index}
                                    style={{
                                        minWidth: minColumnWidth,
                                        width: width || undefined,
                                    }}
                                />
                            ))}
                        </colgroup>

                        <tbody className="min-w-full">{children}</tbody>
                    </table>
                </PlateElement>
            </TableFloatingToolbar>
        );
    })
);

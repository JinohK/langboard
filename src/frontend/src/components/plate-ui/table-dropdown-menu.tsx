"use client";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { findNode, someNode } from "@udecode/plate-common";
import { focusEditor, useEditorPlugin, useEditorSelector } from "@udecode/plate-common/react";
import { deleteTable, insertTableRow, TTableCellElement, TTableElement, TTableRowElement } from "@udecode/plate-table";
import { TablePlugin } from "@udecode/plate-table/react";
import { deleteColumn, deleteRow, insertTable } from "@udecode/plate-table";
import { Minus, Plus, RectangleHorizontal, RectangleVertical, Table, Trash } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { DropdownMenu } from "@/components/base";
import { useTranslation } from "react-i18next";

export function TableDropdownMenu(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const tableSelected = useEditorSelector((editor) => someNode(editor, { match: { type: TablePlugin.key } }), []);
    const table = useEditorSelector((editor) => findNode<TTableElement>(editor, { match: { type: TablePlugin.key } }), []);

    const { editor, tf } = useEditorPlugin(TablePlugin);

    const openState = DropdownMenu.useOpenState();

    return (
        <DropdownMenu.Root modal={false} {...openState} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={openState.open} tooltip={t("editor.Table")} isDropdown>
                    <Table />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="flex w-[180px] min-w-0 flex-col" align="start">
                <DropdownMenu.Group>
                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger>
                            <Table className="size-4" />
                            <span>{t("editor.Table")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                onSelect={() => {
                                    insertTable(editor, {}, { select: true });
                                    focusEditor(editor);
                                }}
                            >
                                <Plus className="size-4" />
                                {t("editor.Insert table")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    deleteTable(editor);
                                    focusEditor(editor);
                                }}
                            >
                                <Trash className="size-4" />
                                {t("editor.Delete table")}
                            </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger disabled={!tableSelected}>
                            <RectangleVertical className="size-4" />
                            <span>{t("editor.Column")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.insert.tableColumn();
                                    focusEditor(editor);
                                }}
                            >
                                <Plus className="size-4" />
                                {t("editor.Insert column after")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={
                                    !tableSelected ||
                                    (table &&
                                        ((table[0].children as TTableRowElement[])[0].children as TTableCellElement[])
                                            .map((cell) => cell.colSpan ?? 1)
                                            .reduce((acc, cur) => {
                                                return acc + cur;
                                            }) <= 2)
                                }
                                onSelect={() => {
                                    deleteColumn(editor);
                                    focusEditor(editor);
                                }}
                            >
                                <Minus className="size-4" />
                                {t("editor.Delete column")}
                            </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger disabled={!tableSelected}>
                            <RectangleHorizontal className="size-4" />
                            <span>{t("editor.Row")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    insertTableRow(editor);
                                    focusEditor(editor);
                                }}
                            >
                                <Plus className="size-4" />
                                {t("editor.Insert row after")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected || (table && (table[0].children as unknown[]).length <= 2)}
                                onSelect={() => {
                                    deleteRow(editor);
                                    focusEditor(editor);
                                }}
                            >
                                <Minus className="size-4" />
                                {t("editor.Delete row")}
                            </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

"use client";

import { useState } from "react";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { cn } from "@udecode/cn";
import { useEditorPlugin, useEditorSelector } from "@udecode/plate/react";
import { TablePlugin, useTableMergeState } from "@udecode/plate-table/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Combine, Grid3x3Icon, Table, Trash2Icon, Ungroup, XIcon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { DropdownMenu } from "@/components/base";
import { useTranslation } from "react-i18next";

export function TableDropdownMenu(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const tableSelected = useEditorSelector((editor) => editor.api.some({ match: { type: TablePlugin.key } }), []);

    const { editor, tf } = useEditorPlugin(TablePlugin);
    const openState = DropdownMenu.useOpenState();
    const mergeState = useTableMergeState();

    return (
        <DropdownMenu.Root modal={false} {...openState} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={openState.open} tooltip="Table" isDropdown>
                    <Table />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="flex w-[180px] min-w-0 flex-col" align="start">
                <DropdownMenu.Group>
                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger>
                            <Grid3x3Icon className="size-4" />
                            <span>{t("editor.Table")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent className="m-0 p-0">
                            <TablePicker />
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger disabled={!tableSelected}>
                            <div className="size-4" />
                            <span>{t("editor.Cell")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!mergeState.canMerge}
                                onSelect={() => {
                                    tf.table.merge();
                                    editor.tf.focus();
                                }}
                            >
                                <Combine className="size-4" />
                                {t("editor.Merge cells")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!mergeState.canSplit}
                                onSelect={() => {
                                    tf.table.split();
                                    editor.tf.focus();
                                }}
                            >
                                <Ungroup className="size-4" />
                                {t("editor.Split cells")}
                            </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger disabled={!tableSelected}>
                            <div className="size-4" />
                            <span>{t("editor.Row")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.insert.tableRow({ before: true });
                                    editor.tf.focus();
                                }}
                            >
                                <ArrowUp className="size-4" />
                                {t("editor.Insert row before")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.insert.tableRow();
                                    editor.tf.focus();
                                }}
                            >
                                <ArrowDown className="size-4" />
                                {t("editor.Insert row after")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.remove.tableRow();
                                    editor.tf.focus();
                                }}
                            >
                                <XIcon className="size-4" />
                                {t("editor.Delete row")}
                            </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger disabled={!tableSelected}>
                            <div className="size-4" />
                            <span>{t("editor.Column")}</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.insert.tableColumn({ before: true });
                                    editor.tf.focus();
                                }}
                            >
                                <ArrowLeft className="size-4" />
                                {t("editor.Insert column before")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.insert.tableColumn();
                                    editor.tf.focus();
                                }}
                            >
                                <ArrowRight className="size-4" />
                                {t("editor.Insert column after")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="min-w-[180px]"
                                disabled={!tableSelected}
                                onSelect={() => {
                                    tf.remove.tableColumn();
                                    editor.tf.focus();
                                }}
                            >
                                <XIcon className="size-4" />
                                {t("editor.Delete column")}
                            </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Item
                        className="min-w-[180px]"
                        disabled={!tableSelected}
                        onSelect={() => {
                            tf.remove.table();
                            editor.tf.focus();
                        }}
                    >
                        <Trash2Icon className="size-4" />
                        {t("editor.Delete table")}
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export function TablePicker() {
    const { editor, tf } = useEditorPlugin(TablePlugin);

    const [tablePicker, setTablePicker] = useState({
        grid: Array.from({ length: 8 }, () => Array.from({ length: 8 }).fill(0)),
        size: { colCount: 0, rowCount: 0 },
    });

    const onCellMove = (rowIndex: number, colIndex: number) => {
        const newGrid = [...tablePicker.grid];

        for (let i = 0; i < newGrid.length; i++) {
            for (let j = 0; j < newGrid[i].length; j++) {
                newGrid[i][j] = i >= 0 && i <= rowIndex && j >= 0 && j <= colIndex ? 1 : 0;
            }
        }

        setTablePicker({
            grid: newGrid,
            size: { colCount: colIndex + 1, rowCount: rowIndex + 1 },
        });
    };

    return (
        <div
            className="m-0 !flex flex-col p-0"
            onClick={() => {
                tf.insert.table(tablePicker.size, { select: true });
                editor.tf.focus();
            }}
        >
            <div className="grid size-[130px] grid-cols-8 gap-0.5 p-1">
                {tablePicker.grid.map((rows, rowIndex) =>
                    rows.map((value, columIndex) => {
                        return (
                            <div
                                key={`(${rowIndex},${columIndex})`}
                                className={cn("col-span-1 size-3 border border-solid bg-secondary", !!value && "border-current")}
                                onMouseMove={() => {
                                    onCellMove(rowIndex, columIndex);
                                }}
                            />
                        );
                    })
                )}
            </div>

            <div className="text-center text-xs text-current">
                {tablePicker.size.rowCount} x {tablePicker.size.colCount}
            </div>
        </div>
    );
}

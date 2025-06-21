"use client";

import * as React from "react";
import { useEditorRef, useEditorSelector } from "@udecode/plate/react";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function RedoToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const disabled = useEditorSelector((editor) => editor.history.redos.length === 0, []);

    return (
        <ToolbarButton
            {...props}
            disabled={disabled}
            onClick={() => editor.redo()}
            onMouseDown={(e) => e.preventDefault()}
            tooltip={t("editor.Redo")}
        >
            <Redo2Icon />
        </ToolbarButton>
    );
}

export function UndoToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const disabled = useEditorSelector((editor) => editor.history.undos.length === 0, []);

    return (
        <ToolbarButton
            {...props}
            disabled={disabled}
            onClick={() => editor.undo()}
            onMouseDown={(e) => e.preventDefault()}
            tooltip={t("editor.Undo")}
        >
            <Undo2Icon />
        </ToolbarButton>
    );
}

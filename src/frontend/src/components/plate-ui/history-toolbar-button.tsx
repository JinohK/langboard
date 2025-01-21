"use client";

import { useEditorRef, useEditorSelector, withRef } from "@udecode/plate/react";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const RedoToolbarButton = withRef<typeof ToolbarButton>((props, ref) => {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const disabled = useEditorSelector((editor) => editor.history.redos.length === 0, []);

    return (
        <ToolbarButton
            ref={ref}
            disabled={disabled}
            onClick={() => editor.redo()}
            onMouseDown={(e) => e.preventDefault()}
            tooltip={t("editor.Redo")}
            {...props}
        >
            <Redo2Icon />
        </ToolbarButton>
    );
});

export const UndoToolbarButton = withRef<typeof ToolbarButton>((props, ref) => {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const disabled = useEditorSelector((editor) => editor.history.undos.length === 0, []);

    return (
        <ToolbarButton
            ref={ref}
            disabled={disabled}
            onClick={() => editor.undo()}
            onMouseDown={(e) => e.preventDefault()}
            tooltip={t("editor.Undo")}
            {...props}
        >
            <Undo2Icon />
        </ToolbarButton>
    );
});

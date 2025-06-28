"use client";

import * as React from "react";
import { insertInlineEquation } from "@platejs/math";
import { RadicalIcon } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { ToolbarButton } from "./toolbar";
import { useTranslation } from "react-i18next";

export function InlineEquationToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const editor = useEditorRef();

    return (
        <ToolbarButton
            {...props}
            onClick={() => {
                insertInlineEquation(editor);
            }}
            tooltip={t("editor.Mark as equation")}
        >
            <RadicalIcon />
        </ToolbarButton>
    );
}

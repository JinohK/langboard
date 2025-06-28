"use client";

import * as React from "react";
import { useIndentButton, useOutdentButton } from "@platejs/indent/react";
import { IndentIcon, OutdentIcon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function IndentToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const { props: buttonProps } = useIndentButton();

    return (
        <ToolbarButton {...props} {...buttonProps} tooltip={t("editor.Indent")}>
            <IndentIcon />
        </ToolbarButton>
    );
}

export function OutdentToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const { props: buttonProps } = useOutdentButton();

    return (
        <ToolbarButton {...props} {...buttonProps} tooltip={t("editor.Outdent")}>
            <OutdentIcon />
        </ToolbarButton>
    );
}

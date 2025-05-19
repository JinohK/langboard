"use client";

import { useIndentButton } from "@udecode/plate-indent/react";
import { Indent } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function IndentToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const { props: buttonProps } = useIndentButton();

    return (
        <ToolbarButton {...props} {...buttonProps} tooltip={t("editor.Indent")}>
            <Indent />
        </ToolbarButton>
    );
}

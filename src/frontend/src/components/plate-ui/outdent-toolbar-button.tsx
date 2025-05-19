"use client";

import * as React from "react";
import { useOutdentButton } from "@udecode/plate-indent/react";
import { Outdent } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function OutdentToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const { props: buttonProps } = useOutdentButton();

    return (
        <ToolbarButton {...props} {...buttonProps} tooltip={t("editor.Outdent")}>
            <Outdent />
        </ToolbarButton>
    );
}

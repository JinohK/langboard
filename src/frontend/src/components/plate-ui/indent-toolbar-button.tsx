"use client";

import { withRef } from "@udecode/cn";
import { useIndentButton } from "@udecode/plate-indent/react";
import { Indent } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const IndentToolbarButton = withRef<typeof ToolbarButton>((rest, ref) => {
    const [t] = useTranslation();
    const { props } = useIndentButton();

    return (
        <ToolbarButton ref={ref} tooltip={t("editor.Indent")} {...props} {...rest}>
            <Indent />
        </ToolbarButton>
    );
});

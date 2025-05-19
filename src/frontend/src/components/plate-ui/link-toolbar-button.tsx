"use client";

import { useLinkToolbarButton, useLinkToolbarButtonState } from "@udecode/plate-link/react";
import { Link } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function LinkToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const state = useLinkToolbarButtonState();
    const { props: buttonProps } = useLinkToolbarButton(state);

    return (
        <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip={t("editor.Link")}>
            <Link />
        </ToolbarButton>
    );
}

"use client";

import { withRef } from "@udecode/cn";
import { useLinkToolbarButton, useLinkToolbarButtonState } from "@udecode/plate-link/react";
import { Link } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const LinkToolbarButton = withRef<typeof ToolbarButton>((rest, ref) => {
    const [t] = useTranslation();
    const state = useLinkToolbarButtonState();
    const { props } = useLinkToolbarButton(state);

    return (
        <ToolbarButton ref={ref} data-plate-focus tooltip={t("editor.Link")} {...props} {...rest}>
            <Link />
        </ToolbarButton>
    );
});

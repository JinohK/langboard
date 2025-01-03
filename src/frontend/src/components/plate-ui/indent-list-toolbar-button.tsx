"use client";

import { withRef } from "@udecode/cn";
import { ListStyleType } from "@udecode/plate-indent-list";
import { useIndentListToolbarButton, useIndentListToolbarButtonState } from "@udecode/plate-indent-list/react";
import { List, ListOrdered } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const IndentListToolbarButton = withRef<
    typeof ToolbarButton,
    {
        nodeType?: ListStyleType;
    }
>(({ nodeType = ListStyleType.Disc }, ref) => {
    const [t] = useTranslation();
    const state = useIndentListToolbarButtonState({ nodeType });
    const { props } = useIndentListToolbarButton(state);

    return (
        <ToolbarButton ref={ref} tooltip={t(`editor.${nodeType === ListStyleType.Disc ? "Bulleted list" : "Numbered list"}`)} {...props}>
            {nodeType === ListStyleType.Disc ? <List /> : <ListOrdered />}
        </ToolbarButton>
    );
});

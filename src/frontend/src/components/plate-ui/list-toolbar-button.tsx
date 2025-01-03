"use client";

import { withRef } from "@udecode/cn";
import { BulletedListPlugin, useListToolbarButton, useListToolbarButtonState } from "@udecode/plate-list/react";
import { List, ListOrdered } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const ListToolbarButton = withRef<
    typeof ToolbarButton,
    {
        nodeType?: string;
    }
>(({ nodeType = BulletedListPlugin.key, ...rest }, ref) => {
    const [t] = useTranslation();
    const state = useListToolbarButtonState({ nodeType });
    const { props } = useListToolbarButton(state);

    return (
        <ToolbarButton
            ref={ref}
            tooltip={t(`editor.${nodeType === BulletedListPlugin.key ? "Bulleted list" : "Numbered list"}`)}
            {...props}
            {...rest}
        >
            {nodeType === BulletedListPlugin.key ? <List /> : <ListOrdered />}
        </ToolbarButton>
    );
});

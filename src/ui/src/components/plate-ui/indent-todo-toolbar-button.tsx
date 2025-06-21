"use client";

import { useIndentTodoToolBarButton, useIndentTodoToolBarButtonState } from "@udecode/plate-indent-list/react";
import { ListTodoIcon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export function IndentTodoToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
    const [t] = useTranslation();
    const state = useIndentTodoToolBarButtonState({ nodeType: "todo" });
    const { props: buttonProps } = useIndentTodoToolBarButton(state);

    return (
        <ToolbarButton {...props} {...buttonProps} tooltip={t("editor.Todo")}>
            <ListTodoIcon />
        </ToolbarButton>
    );
}

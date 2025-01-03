"use client";

import { withRef } from "@udecode/cn";
import { useIndentTodoToolBarButton, useIndentTodoToolBarButtonState } from "@udecode/plate-indent-list/react";
import { ListTodoIcon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";

export const IndentTodoToolbarButton = withRef<typeof ToolbarButton>((rest, ref) => {
    const [t] = useTranslation();
    const state = useIndentTodoToolBarButtonState({ nodeType: "todo" });
    const { props } = useIndentTodoToolBarButton(state);

    return (
        <ToolbarButton ref={ref} tooltip={t("editor.Todo")} {...props} {...rest}>
            <ListTodoIcon />
        </ToolbarButton>
    );
});

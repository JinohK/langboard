"use client";

import { withRef } from "@udecode/cn";
import { useEditorRef } from "@udecode/plate-common/react";
import { indentListItems, unindentListItems } from "@udecode/plate-list";
import { IndentIcon, OutdentIcon } from "lucide-react";
import { ToolbarButton } from "./toolbar";
import { useTranslation } from "react-i18next";

export const ListIndentToolbarButton = withRef<typeof ToolbarButton, { reverse?: bool }>(({ reverse = false, ...rest }, ref) => {
    const [t] = useTranslation();
    const editor = useEditorRef();

    return (
        <ToolbarButton
            ref={ref}
            onClick={() => {
                if (reverse) {
                    unindentListItems(editor);
                } else {
                    indentListItems(editor);
                }
            }}
            tooltip={t(`editor.${reverse ? "Outdent" : "Indent"}`)}
            {...rest}
        >
            {reverse ? <OutdentIcon /> : <IndentIcon />}
        </ToolbarButton>
    );
});

"use client";

import { BoldPlugin, CodePlugin, ItalicPlugin, StrikethroughPlugin, UnderlinePlugin } from "@udecode/plate-basic-marks/react";
import { useEditorReadOnly } from "@udecode/plate-common/react";
import { BoldIcon, Code2Icon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from "lucide-react";
import { AIToolbarButton } from "./ai-toolbar-button";
import { LinkToolbarButton } from "./link-toolbar-button";
import { MarkToolbarButton } from "./mark-toolbar-button";
import { MoreMarkDropdownMenu } from "./more-mark-dropdown-menu";
import { ToolbarGroup } from "./toolbar";
import { TurnIntoDropdownMenu } from "./turn-into-dropdown-menu";
import { useTranslation } from "react-i18next";

export function FloatingToolbarButtons() {
    const [t] = useTranslation();
    const readOnly = useEditorReadOnly();

    return (
        <>
            {!readOnly && (
                <>
                    <ToolbarGroup>
                        <AIToolbarButton tooltip={t("editor.AI commands")}>
                            <WandSparklesIcon />
                            {t("editor.Ask AI")}
                        </AIToolbarButton>
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <TurnIntoDropdownMenu />

                        <MarkToolbarButton nodeType={BoldPlugin.key} tooltip={t("editor.Bold (⌘+B)")}>
                            <BoldIcon />
                        </MarkToolbarButton>

                        <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip={t("editor.Italic (⌘+I)")}>
                            <ItalicIcon />
                        </MarkToolbarButton>

                        <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip={t("editor.Underline (⌘+U)")}>
                            <UnderlineIcon />
                        </MarkToolbarButton>

                        <MarkToolbarButton nodeType={StrikethroughPlugin.key} tooltip={t("editor.Strikethrough (⌘+⇧+M)")}>
                            <StrikethroughIcon />
                        </MarkToolbarButton>

                        <MarkToolbarButton nodeType={CodePlugin.key} tooltip={t("editor.Code (⌘+E)")}>
                            <Code2Icon />
                        </MarkToolbarButton>

                        <LinkToolbarButton />
                    </ToolbarGroup>
                </>
            )}

            <ToolbarGroup>{!readOnly && <MoreMarkDropdownMenu />}</ToolbarGroup>
        </>
    );
}

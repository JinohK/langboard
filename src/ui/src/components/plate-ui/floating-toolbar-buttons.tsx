"use client";

import { BoldPlugin, CodePlugin, ItalicPlugin, StrikethroughPlugin, UnderlinePlugin } from "@udecode/plate-basic-marks/react";
import { useEditorReadOnly } from "@udecode/plate/react";
import { BoldIcon, Code2Icon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from "lucide-react";
import { AIToolbarButton } from "@/components/plate-ui/ai-toolbar-button";
import { LinkToolbarButton } from "@/components/plate-ui/link-toolbar-button";
import { MarkToolbarButton } from "@/components/plate-ui/mark-toolbar-button";
import { MoreMarkDropdownMenu } from "@/components/plate-ui/more-mark-dropdown-menu";
import { ToolbarGroup } from "@/components/plate-ui/toolbar";
import { TurnIntoDropdownMenu } from "@/components/plate-ui/turn-into-dropdown-menu";
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

"use client";

import { BoldPlugin, CodePlugin, ItalicPlugin, StrikethroughPlugin, UnderlinePlugin } from "@udecode/plate-basic-marks/react";
import { useEditorReadOnly } from "@udecode/plate/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { ListStyleType } from "@udecode/plate-indent-list";
import { AudioPlugin, FilePlugin, ImagePlugin, VideoPlugin } from "@udecode/plate-media/react";
import { BoldIcon, Code2Icon, HighlighterIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from "lucide-react";
import { MoreMarkDropdownMenu } from "@/components/plate-ui/more-mark-dropdown-menu";
import { AIToolbarButton } from "@/components/plate-ui/ai-toolbar-button";
import { EmojiDropdownMenu } from "@/components/plate-ui/emoji-dropdown-menu";
import { RedoToolbarButton, UndoToolbarButton } from "@/components/plate-ui/history-toolbar-button";
import { IndentListToolbarButton } from "@/components/plate-ui/indent-list-toolbar-button";
import { IndentTodoToolbarButton } from "@/components/plate-ui/indent-todo-toolbar-button";
import { IndentToolbarButton } from "@/components/plate-ui/indent-toolbar-button";
import { InsertDropdownMenu } from "@/components/plate-ui/insert-dropdown-menu";
import { LinkToolbarButton } from "@/components/plate-ui/link-toolbar-button";
import { MarkToolbarButton } from "@/components/plate-ui/mark-toolbar-button";
import { MediaToolbarButton } from "@/components/plate-ui/media-toolbar-button";
import { ModeDropdownMenu } from "@/components/plate-ui/mode-dropdown-menu";
import { OutdentToolbarButton } from "@/components/plate-ui/outdent-toolbar-button";
import { TableDropdownMenu } from "@/components/plate-ui/table-dropdown-menu";
import { ToolbarGroup } from "@/components/plate-ui/toolbar";
import { TurnIntoDropdownMenu } from "@/components/plate-ui/turn-into-dropdown-menu";
import { useTranslation } from "react-i18next";

export function FixedToolbarButtons() {
    const [t] = useTranslation();
    const readOnly = useEditorReadOnly();

    return (
        <div className="flex w-full">
            {!readOnly && (
                <>
                    <ToolbarGroup>
                        <UndoToolbarButton />
                        <RedoToolbarButton />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <AIToolbarButton tooltip={t("editor.AI commands")}>
                            <WandSparklesIcon />
                        </AIToolbarButton>
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <InsertDropdownMenu />
                        <TurnIntoDropdownMenu />
                    </ToolbarGroup>

                    <ToolbarGroup>
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

                        <MoreMarkDropdownMenu />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <IndentListToolbarButton nodeType={ListStyleType.Disc} />
                        <IndentListToolbarButton nodeType={ListStyleType.Decimal} />
                        <IndentTodoToolbarButton />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <LinkToolbarButton />
                        <TableDropdownMenu />
                        <EmojiDropdownMenu />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <MediaToolbarButton nodeType={ImagePlugin.key} />
                        <MediaToolbarButton nodeType={VideoPlugin.key} />
                        <MediaToolbarButton nodeType={AudioPlugin.key} />
                        <MediaToolbarButton nodeType={FilePlugin.key} />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        <OutdentToolbarButton />
                        <IndentToolbarButton />
                    </ToolbarGroup>
                </>
            )}

            <div className="grow" />

            <ToolbarGroup>
                <MarkToolbarButton nodeType={HighlightPlugin.key} tooltip={t("editor.Highlight")}>
                    <HighlighterIcon />
                </MarkToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
                <ModeDropdownMenu />
            </ToolbarGroup>
        </div>
    );
}

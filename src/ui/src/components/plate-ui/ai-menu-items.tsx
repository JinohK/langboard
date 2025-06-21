"use client";

import { useEffect, useMemo } from "react";
import { type SlateEditor, NodeApi } from "@udecode/plate";
import { AIChatPlugin, AIPlugin } from "@udecode/plate-ai/react";
import { useIsSelecting } from "@udecode/plate-selection/react";
import { type PlateEditor, useEditorRef, usePluginOption } from "@udecode/plate/react";
import { Album, BadgeHelp, Check, CornerUpLeft, FeatherIcon, ListEnd, ListMinus, ListPlus, PenLine, SmileIcon, Wand, X } from "lucide-react";
import { Command } from "@/components/base";
import { useTranslation } from "react-i18next";

export type EditorChatState = "cursorCommand" | "cursorSuggestion" | "selectionCommand" | "selectionSuggestion";

export const aiChatItems = {
    accept: {
        icon: <Check className="size-4" />,
        label: "editor.Accept",
        value: "accept",
        onSelect: ({ editor }) => {
            editor.getTransforms(AIChatPlugin).aiChat.accept();
            editor.tf.focus({ edge: "end" });
        },
    },
    continueWrite: {
        icon: <PenLine className="size-4" />,
        label: "editor.Continue writing",
        value: "continueWrite",
        onSelect: ({ editor }) => {
            const ancestorNode = editor.api.block({ highest: true });

            if (!ancestorNode) return;

            const isEmpty = NodeApi.string(ancestorNode[0]).trim().length === 0;

            void editor.getApi(AIChatPlugin).aiChat.submit({
                mode: "insert",
                prompt: isEmpty
                    ? `<Document>
{editor}
</Document>
Start writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`
                    : "Continue writing AFTER <Block> ONLY ONE SENTENCE. DONT REPEAT THE TEXT.",
            });
        },
    },
    discard: {
        icon: <X className="size-4" />,
        label: "editor.Discard",
        shortcut: "Escape",
        value: "discard",
        onSelect: ({ editor }) => {
            editor.getTransforms(AIPlugin).ai.undo();
            editor.getApi(AIChatPlugin).aiChat.hide();
        },
    },
    emojify: {
        icon: <SmileIcon />,
        label: "Emojify",
        value: "emojify",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: "Emojify",
            });
        },
    },
    explain: {
        icon: <BadgeHelp className="size-4" />,
        label: "editor.Explain",
        value: "explain",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: {
                    default: "Explain {editor}",
                    selecting: "Explain",
                },
            });
        },
    },
    fixSpelling: {
        icon: <Check className="size-4" />,
        label: "editor.Fix spelling & grammar",
        value: "fixSpelling",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: "Fix spelling and grammar",
            });
        },
    },
    improveWriting: {
        icon: <Wand className="size-4" />,
        label: "editor.Improve writing",
        value: "improveWriting",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: "Improve the writing",
            });
        },
    },
    insertBelow: {
        icon: <ListEnd className="size-4" />,
        label: "editor.Insert below",
        value: "insertBelow",
        onSelect: ({ aiEditor, editor }) => {
            void editor.getTransforms(AIChatPlugin).aiChat.insertBelow(aiEditor);
        },
    },
    makeLonger: {
        icon: <ListPlus className="size-4" />,
        label: "editor.Make longer",
        value: "makeLonger",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: "Make longer",
            });
        },
    },
    makeShorter: {
        icon: <ListMinus className="size-4" />,
        label: "editor.Make shorter",
        value: "makeShorter",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: "Make shorter",
            });
        },
    },
    replace: {
        icon: <Check className="size-4" />,
        label: "editor.Replace selection",
        value: "replace",
        onSelect: ({ aiEditor, editor }) => {
            void editor.getTransforms(AIChatPlugin).aiChat.replaceSelection(aiEditor);
        },
    },
    simplifyLanguage: {
        icon: <FeatherIcon className="size-4" />,
        label: "editor.Simplify language",
        value: "simplifyLanguage",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                prompt: "Simplify the language",
            });
        },
    },
    summarize: {
        icon: <Album className="size-4" />,
        label: "editor.Add a summary",
        value: "summarize",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.submit({
                mode: "insert",
                prompt: {
                    default: "Summarize {editor}",
                    selecting: "Summarize",
                },
            });
        },
    },
    tryAgain: {
        icon: <CornerUpLeft className="size-4" />,
        label: "editor.Try again",
        value: "tryAgain",
        onSelect: ({ editor }) => {
            void editor.getApi(AIChatPlugin).aiChat.reload();
        },
    },
} satisfies Record<
    string,
    {
        icon: React.ReactNode;
        label: string;
        value: string;
        component?: React.ComponentType<{ menuState: EditorChatState }>;
        filterItems?: bool;
        items?: { label: string; value: string }[];
        shortcut?: string;
        onSelect?: ({ aiEditor, editor }: { aiEditor: SlateEditor; editor: PlateEditor }) => void;
    }
>;

const menuStateItems: Record<
    EditorChatState,
    {
        items: (typeof aiChatItems)[keyof typeof aiChatItems][];
        heading?: string;
    }[]
> = {
    cursorCommand: [
        {
            items: [aiChatItems.continueWrite, aiChatItems.summarize, aiChatItems.explain],
        },
    ],
    cursorSuggestion: [
        {
            items: [aiChatItems.accept, aiChatItems.discard, aiChatItems.tryAgain],
        },
    ],
    selectionCommand: [
        {
            items: [
                aiChatItems.improveWriting,
                aiChatItems.emojify,
                aiChatItems.makeLonger,
                aiChatItems.makeShorter,
                aiChatItems.fixSpelling,
                aiChatItems.simplifyLanguage,
            ],
        },
    ],
    selectionSuggestion: [
        {
            items: [aiChatItems.replace, aiChatItems.insertBelow, aiChatItems.discard, aiChatItems.tryAgain],
        },
    ],
};

export const AIMenuItems = ({ setValue }: { setValue: (value: string) => void }) => {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const { messages } = usePluginOption(AIChatPlugin, "chat");
    const aiEditor = usePluginOption(AIChatPlugin, "aiEditor")!;
    const isSelecting = useIsSelecting();

    const menuState = useMemo(() => {
        if (messages && messages.length > 0) {
            return isSelecting ? "selectionSuggestion" : "cursorSuggestion";
        }

        return isSelecting ? "selectionCommand" : "cursorCommand";
    }, [isSelecting, messages]);

    const menuGroups = useMemo(() => {
        const items = menuStateItems[menuState];

        return items;
    }, [menuState]);

    useEffect(() => {
        if (menuGroups.length > 0 && menuGroups[0].items.length > 0) {
            setValue(menuGroups[0].items[0].value);
        }
    }, [menuGroups, setValue]);

    return (
        <>
            {menuGroups.map((group, index) => (
                <Command.Group key={index} heading={group.heading}>
                    {group.items.map((menuItem) => (
                        <Command.Item
                            key={menuItem.value}
                            className="[&_svg]:text-muted-foreground"
                            value={menuItem.value}
                            onSelect={() => {
                                menuItem.onSelect?.({
                                    aiEditor,
                                    editor: editor,
                                });
                            }}
                        >
                            {menuItem.icon}
                            <span className="ml-1">{t(menuItem.label)}</span>
                        </Command.Item>
                    ))}
                </Command.Group>
            ))}
        </>
    );
};

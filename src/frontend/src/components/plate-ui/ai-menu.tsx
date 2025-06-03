"use client";

import * as React from "react";
import { type NodeEntry, isHotkey } from "@udecode/plate";
import { AIChatPlugin, useEditorChat, useLastAssistantMessage } from "@udecode/plate-ai/react";
import { BlockSelectionPlugin, useIsSelecting } from "@udecode/plate-selection/react";
import { useEditorPlugin, useHotkeys, usePluginOption } from "@udecode/plate/react";
import { Loader2Icon } from "lucide-react";
import { IUseChat, useChat } from "@/components/Editor/useChat";
import { AIChatEditor } from "@/components/plate-ui/ai-chat-editor";
import { AIMenuItems } from "@/components/plate-ui/ai-menu-items";
import { Command, Popover } from "@/components/base";
import { useTranslation } from "react-i18next";

export interface IAIMenuProps extends IUseChat {}

export function AIMenu({ socket, eventKey, events, commonEventData }: IAIMenuProps) {
    const [t] = useTranslation();
    const { api, editor } = useEditorPlugin(AIChatPlugin);
    const open = usePluginOption(AIChatPlugin, "open");
    const mode = usePluginOption(AIChatPlugin, "mode");
    const streaming = usePluginOption(AIChatPlugin, "streaming");
    const isSelecting = useIsSelecting();

    const [value, setValue] = React.useState("");

    const chat = useChat({ socket, eventKey, events, commonEventData });

    const { input, messages, setInput, status } = chat;
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);

    const content = useLastAssistantMessage()?.content;

    React.useEffect(() => {
        if (streaming) {
            const anchor = api.aiChat.node({ anchor: true });
            setTimeout(() => {
                const anchorDom = editor.api.toDOMNode(anchor![0])!;
                setAnchorElement(anchorDom);
            }, 0);
        }
    }, [streaming]);

    const setOpen = (open: bool) => {
        if (open) {
            api.aiChat.show();
        } else {
            api.aiChat.hide();
        }
    };

    const show = (anchorElement: HTMLElement) => {
        setAnchorElement(anchorElement);
        setOpen(true);
    };

    useEditorChat({
        chat,
        onOpenBlockSelection: (blocks: NodeEntry[]) => {
            show(editor.api.toDOMNode(blocks.at(-1)![0])!);
        },
        onOpenChange: (open) => {
            if (!open) {
                setAnchorElement(null);
                setInput("");
            }
        },
        onOpenCursor: () => {
            const [ancestor] = editor.api.block({ highest: true })!;

            if (!editor.api.isAt({ end: true }) && !editor.api.isEmpty(ancestor)) {
                editor.getApi(BlockSelectionPlugin).blockSelection.set(ancestor.id as string);
            }

            show(editor.api.toDOMNode(ancestor)!);
        },
        onOpenSelection: () => {
            show(editor.api.toDOMNode(editor.api.blocks().at(-1)![0])!);
        },
    });

    useHotkeys(
        "meta+j",
        () => {
            api.aiChat.show();
        },
        { enableOnContentEditable: true, enableOnFormTags: true }
    );

    useHotkeys("esc", () => {
        api.aiChat.stop();

        chat.abort();
    });

    const isLoading = status === "streaming" || status === "submitted";

    if (isLoading && mode === "insert") {
        return null;
    }

    return (
        <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
            <Popover.Anchor virtualRef={{ current: anchorElement! }} />

            <Popover.Content
                className="border-none bg-transparent p-0 shadow-none"
                style={{
                    width: anchorElement?.offsetWidth,
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();

                    api.aiChat.hide();
                }}
                align="center"
                side="bottom"
            >
                <Command.Root className="w-full rounded-lg border shadow-md" value={value} onValueChange={setValue}>
                    {mode === "chat" && isSelecting && content && <AIChatEditor content={content} />}

                    {isLoading ? (
                        <div className="flex grow select-none items-center gap-2 p-2 text-sm text-muted-foreground">
                            <Loader2Icon className="size-4 animate-spin" />
                            {t(`editor.${messages.length > 1 ? "Editing..." : "Thinking..."}`)}
                        </div>
                    ) : (
                        <Command.Input
                            className="rounded-none border-b border-solid border-border [&_svg]:hidden"
                            value={input}
                            onKeyDown={(e) => {
                                if (isHotkey("backspace")(e) && input.length === 0) {
                                    e.preventDefault();
                                    api.aiChat.hide();
                                }
                                if (isHotkey("enter")(e) && !e.shiftKey && !value) {
                                    e.preventDefault();
                                    void api.aiChat.submit();
                                }
                            }}
                            onValueChange={setInput}
                            placeholder={t("editor.Ask AI anything...")}
                            data-plate-focus
                            autoFocus
                        />
                    )}

                    {!isLoading && (
                        <Command.List>
                            <AIMenuItems setValue={setValue} />
                        </Command.List>
                    )}
                </Command.Root>
            </Popover.Content>
        </Popover.Root>
    );
}

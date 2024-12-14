"use client";

import * as React from "react";
import { AIChatPlugin, useEditorChat } from "@udecode/plate-ai/react";
import { type TElement, type TNodeEntry, getAncestorNode, getBlocks, isElementEmpty, isHotkey, isSelectionAtBlockEnd } from "@udecode/plate-common";
import { type PlateEditor, toDOMNode, useEditorPlugin, useHotkeys } from "@udecode/plate-common/react";
import { BlockSelectionPlugin, useIsSelecting } from "@udecode/plate-selection/react";
import { Loader2Icon } from "lucide-react";
import { IUseChat, useChat } from "@/components/Editor/useChat";
import { AIChatEditor } from "./ai-chat-editor";
import { AIMenuItems } from "./ai-menu-items";
import { Command, Popover } from "@/components/base";
import { useTranslation } from "react-i18next";

export interface IAIMenuProps extends IUseChat {}

export function AIMenu({ socket, eventKey, events }: IAIMenuProps) {
    const [t] = useTranslation();
    const { api, editor, useOption } = useEditorPlugin(AIChatPlugin);
    const open = useOption("open");
    const mode = useOption("mode");
    const isSelecting = useIsSelecting();

    const aiEditorRef = React.useRef<PlateEditor | null>(null);
    const [value, setValue] = React.useState("");

    const chat = useChat({ socket, eventKey, events });

    const { input, isLoading, messages, setInput } = chat;
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);

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
        onOpenBlockSelection: (blocks: TNodeEntry[]) => {
            show(toDOMNode(editor, blocks.at(-1)![0])!);
        },
        onOpenChange: (open) => {
            if (!open) {
                setAnchorElement(null);
                setInput("");
            }
        },
        onOpenCursor: () => {
            const ancestor = getAncestorNode(editor)?.[0] as TElement;

            if (!isSelectionAtBlockEnd(editor) && !isElementEmpty(editor, ancestor)) {
                editor.getApi(BlockSelectionPlugin).blockSelection.addSelectedRow(ancestor.id as string);
            }

            show(toDOMNode(editor, ancestor)!);
        },
        onOpenSelection: () => {
            show(toDOMNode(editor, getBlocks(editor).at(-1)![0])!);
        },
    });

    useHotkeys(
        "meta+j",
        () => {
            api.aiChat.show();
        },
        { enableOnContentEditable: true, enableOnFormTags: true }
    );

    return (
        <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
            <Popover.Anchor virtualRef={{ current: anchorElement }} />

            <Popover.Content
                className="border-none bg-transparent p-0 shadow-none"
                style={{
                    width: anchorElement?.offsetWidth,
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();

                    if (isLoading) {
                        api.aiChat.stop();
                    } else {
                        api.aiChat.hide();
                    }
                }}
                align="center"
                avoidCollisions={false}
                side="bottom"
            >
                <Command.Root className="w-full rounded-lg border shadow-md" value={value} onValueChange={setValue}>
                    {mode === "chat" && isSelecting && messages.length > 0 && <AIChatEditor aiEditorRef={aiEditorRef} />}

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
                            withoutIcon
                            data-plate-focus
                            autoFocus
                        />
                    )}

                    {!isLoading && (
                        <Command.List>
                            <AIMenuItems aiEditorRef={aiEditorRef} setValue={setValue} />
                        </Command.List>
                    )}
                </Command.Root>
            </Popover.Content>
        </Popover.Root>
    );
}

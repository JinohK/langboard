/* eslint-disable quotes */
"use client";

import { AIChatPlugin } from "@platejs/ai/react";
import { type PlateElementProps, type PlateTextProps, PlateElement, PlateText, usePluginOption } from "platejs/react";
import { cn } from "@/core/utils/ComponentUtils";

export function AILeaf(props: PlateTextProps) {
    const streaming = usePluginOption(AIChatPlugin, "streaming");
    const streamingLeaf = props.editor.getApi(AIChatPlugin).aiChat.node({ streaming: true });

    const isLast = streamingLeaf?.[0] === props.text;

    return (
        <PlateText
            className={cn(
                "border-b-2 border-b-secondary/80 bg-secondary/50 text-secondary-foreground/80",
                "transition-all duration-200 ease-in-out",
                isLast &&
                    streaming &&
                    'after:ml-1.5 after:inline-block after:h-3 after:w-3 after:rounded-full after:bg-primary after:align-middle after:content-[""]'
            )}
            {...props}
        />
    );
}

export function AIAnchorElement(props: PlateElementProps) {
    return (
        <PlateElement {...props}>
            <div className="h-[0.1px]" />
        </PlateElement>
    );
}

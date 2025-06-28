/* eslint-disable @/max-len */
"use client";

import { cn } from "@/core/utils/ComponentUtils";
import { Toolbar } from "@/components/plate-ui/toolbar";
import { useEditorRef } from "platejs/react";

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
    const editor = useEditorRef();

    if (editor.dom.readOnly) {
        return null;
    }

    return (
        <Toolbar
            {...props}
            className={cn(
                "supports-backdrop-blur:bg-background/60 sticky left-0 top-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm",
                props.className
            )}
        />
    );
}

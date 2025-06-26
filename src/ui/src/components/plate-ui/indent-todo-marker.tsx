"use client";

import type { SlateRenderElementProps } from "@udecode/plate";
import { cn } from "@udecode/cn";
import { useIndentTodoListElement, useIndentTodoListElementState } from "@udecode/plate-indent-list/react";
import { useReadOnly } from "@udecode/plate/react";
import { Checkbox } from "@/components/base";

export const TodoMarker = ({ element }: Omit<SlateRenderElementProps, "children">) => {
    const state = useIndentTodoListElementState({ element });
    const { checkboxProps } = useIndentTodoListElement(state);
    const readOnly = useReadOnly();

    return (
        <div contentEditable={false}>
            <Checkbox className={cn("absolute -left-6 top-0.5", readOnly && "pointer-events-none")} {...checkboxProps} />
        </div>
    );
};

export const TodoLi = (props: SlateRenderElementProps) => {
    const { children, element } = props;

    return <li className={cn("list-none", (element.checked as bool) && "text-muted-foreground line-through")}>{children}</li>;
};

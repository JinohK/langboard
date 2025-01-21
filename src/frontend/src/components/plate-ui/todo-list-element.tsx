"use client";

import { cn, withRef } from "@udecode/cn";
import { useTodoListElement, useTodoListElementState } from "@udecode/plate-list/react";
import { PlateElement } from "@/components/plate-ui/plate-element";
import { Checkbox } from "@/components/base";

export const TodoListElement = withRef<typeof PlateElement>(({ children, className, ...props }, ref) => {
    const { element } = props;
    const state = useTodoListElementState({ element });
    const { checkboxProps } = useTodoListElement(state);

    return (
        <PlateElement ref={ref} className={cn(className, "flex flex-row py-1")} {...props}>
            <div className="mr-1.5 flex select-none items-center justify-center" contentEditable={false}>
                <Checkbox {...checkboxProps} />
            </div>
            <span
                className={cn("flex-1 focus:outline-none", state.checked && "text-muted-foreground line-through")}
                contentEditable={!state.readOnly}
                suppressContentEditableWarning
            >
                {children}
            </span>
        </PlateElement>
    );
});

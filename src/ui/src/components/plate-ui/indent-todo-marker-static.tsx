import type { SlateRenderElementProps } from "@udecode/plate";
import { cn } from "@udecode/cn";
import { CheckboxStatic } from "@/components/plate-ui/checkbox-static";

export const TodoMarkerStatic = ({ element }: Omit<SlateRenderElementProps, "children">) => {
    return (
        <div contentEditable={false}>
            <CheckboxStatic className="pointer-events-none absolute -left-6 top-0.5" checked={element.checked as bool} />
        </div>
    );
};

export const TodoLiStatic = ({ children, element }: SlateRenderElementProps) => {
    return <li className={cn("list-none", (element.checked as bool) && "text-muted-foreground line-through")}>{children}</li>;
};

"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@/components/base/ScrollArea/Primitive";
import { cn } from "@/core/utils/ComponentUtils";

interface IScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
    viewportId?: string;
    viewportClassName?: string;
    mutable?: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>["mutable"];
}

const Root = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, IScrollAreaProps>(
    ({ className, children, viewportId, viewportClassName, mutable, onScroll, ...props }, ref) => (
        <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
            <ScrollAreaPrimitive.Viewport className={cn("h-full w-full rounded-[inherit]", viewportClassName)} id={viewportId} onScroll={onScroll}>
                {children}
            </ScrollAreaPrimitive.Viewport>
            <Bar mutable={mutable} />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    )
);
Root.displayName = ScrollAreaPrimitive.Root.displayName;

const Bar = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
            "flex cursor-pointer touch-none select-none transition-colors",
            orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
            orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
            className
        )}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
Bar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { Root, Bar };

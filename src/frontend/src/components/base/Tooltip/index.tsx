/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @/max-len */
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/core/utils/ComponentUtils";

const Provider = TooltipPrimitive.Provider;

const Root = TooltipPrimitive.Root;

const Trigger = TooltipPrimitive.Trigger;

const Portal = TooltipPrimitive.Portal;

const Content = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
    ({ className, sideOffset = 4, ...props }, ref) => (
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    )
);
Content.displayName = TooltipPrimitive.Content.displayName;

function withTooltip<T extends React.ComponentType<any> | keyof HTMLElementTagNameMap>(Component: T) {
    return React.forwardRef<
        React.ElementRef<T>,
        {
            tooltipContentProps?: Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>, "children">;
            tooltipProps?: Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>, "children">;
            tooltip?: React.ReactNode;
        } & React.ComponentPropsWithoutRef<T> &
            Omit<TooltipPrimitive.TooltipProviderProps, "children">
    >(function ExtendComponent(
        { delayDuration = 0, disableHoverableContent = true, skipDelayDuration = 0, tooltip, tooltipContentProps, tooltipProps, ...props },
        ref
    ) {
        const [mounted, setMounted] = React.useState(false);

        React.useEffect(() => {
            setMounted(true);
        }, []);

        const component = <Component ref={ref} {...(props as any)} />;

        if (tooltip && mounted) {
            return (
                <Provider delayDuration={delayDuration} disableHoverableContent={disableHoverableContent} skipDelayDuration={skipDelayDuration}>
                    <Root {...tooltipProps}>
                        <Trigger asChild>{component}</Trigger>

                        <Portal>
                            <Content {...tooltipContentProps}>{tooltip}</Content>
                        </Portal>
                    </Root>
                </Provider>
            );
        }

        return component;
    });
}

export { Content, Provider, Root, Trigger, Portal, withTooltip };

/* eslint-disable @/max-len */
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";
import { Flex, ScrollArea } from "@/components/base";

const Root = DialogPrimitive.Root;

const Trigger = DialogPrimitive.Trigger;

const Portal = DialogPrimitive.Portal;

const Close = DialogPrimitive.Close;

const Overlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Overlay
            ref={ref}
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className
            )}
            {...props}
        />
    )
);
Overlay.displayName = DialogPrimitive.Overlay.displayName;

const CloseButton = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Close>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Close
            className={cn(
                "rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                className
            )}
            {...props}
            ref={ref}
        >
            <IconComponent icon="x" size="4" />
            <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
    )
);

const Content = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { viewportId?: string; withCloseButton?: bool }
>(({ className, children, viewportId, withCloseButton = true, ...props }, ref) => {
    const onOverlayClick = (event: React.PointerEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).hasAttribute("data-scroll-area-scrollbar")) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    return (
        <Portal>
            <Overlay onPointerDown={onOverlayClick}>
                <ScrollArea.Root className="size-full" viewportClassName="max-h-screen sm:py-2" viewportId={viewportId}>
                    <Flex justify="center" items="center" size="full">
                        <DialogPrimitive.Content
                            ref={ref}
                            className={cn(
                                "relative w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
                                className
                            )}
                            {...props}
                        >
                            {withCloseButton && <CloseButton className="sticky right-0 top-2 z-50" />}
                            {children}
                        </DialogPrimitive.Content>
                    </Flex>
                </ScrollArea.Root>
            </Overlay>
        </Portal>
    );
});
Content.displayName = DialogPrimitive.Content.displayName;

const Header = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
Header.displayName = "DialogHeader";

const Footer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
Footer.displayName = "DialogFooter";

const Title = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
    )
);
Title.displayName = DialogPrimitive.Title.displayName;

const Description = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
Description.displayName = DialogPrimitive.Description.displayName;

export { Close, CloseButton, Content, Description, Footer, Header, Overlay, Portal, Root, Title, Trigger };

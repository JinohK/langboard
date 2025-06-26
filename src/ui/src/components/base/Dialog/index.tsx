/* eslint-disable @/max-len */
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import IconComponent from "@/components/base/IconComponent";
import { cn } from "@/core/utils/ComponentUtils";
import * as ScrollArea from "@/components/base/ScrollArea";
import { motion } from "framer-motion";

const Root = DialogPrimitive.Root;

const Trigger = DialogPrimitive.Trigger;

const Portal = DialogPrimitive.Portal;

const Close = DialogPrimitive.Close;

const Overlay = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Overlay
            ref={ref}
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className
            )}
            {...props}
        />
    )
);
Overlay.displayName = DialogPrimitive.Overlay.displayName;

const CloseButton = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Close>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>>(
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

interface IContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
    viewportId?: string;
    viewportRef?: React.RefObject<HTMLDivElement | null>;
    withCloseButton?: bool;
    overlayClassName?: string;
    disableOverlayClick?: bool;
}

const Content = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Content>, IContentProps>(
    (
        {
            className,
            children,
            viewportId,
            viewportRef,
            withCloseButton = true,
            overlayClassName,
            disableOverlayClick,
            onPointerDownOutside,
            ...props
        },
        ref
    ) => {
        const onOverlayClick = (
            event:
                | React.PointerEvent<HTMLDivElement>
                | CustomEvent<{
                      originalEvent: PointerEvent;
                  }>
        ) => {
            const target = event.target as HTMLElement;
            if (
                disableOverlayClick ||
                target.hasAttribute("data-scroll-area-scrollbar") ||
                target.closest("[data-scroll-area-scrollbar]") ||
                target.closest("[data-sonner-toast]")
            ) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        return (
            <Portal>
                <Overlay onPointerDown={onOverlayClick} className={overlayClassName}>
                    <ScrollArea.Root
                        className="size-full"
                        viewportClassName="max-h-screen sm:py-2 [&>div]:h-full"
                        viewportId={viewportId}
                        viewportRef={viewportRef}
                        viewportAsTable
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="z-50 flex size-full items-center justify-center shadow-lg"
                        >
                            <DialogPrimitive.Content
                                ref={ref}
                                className={cn(
                                    "relative w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 focus-visible:outline-none sm:rounded-lg",
                                    className
                                )}
                                onPointerDownOutside={(e) => {
                                    onOverlayClick(e);
                                    onPointerDownOutside?.(e);
                                }}
                                {...props}
                            >
                                {withCloseButton && <CloseButton className="absolute right-2 top-2 z-50" />}
                                {children}
                            </DialogPrimitive.Content>
                        </motion.div>
                    </ScrollArea.Root>
                </Overlay>
            </Portal>
        );
    }
);
Content.displayName = DialogPrimitive.Content.displayName;

const Header = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
Header.displayName = "DialogHeader";

const Footer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
Footer.displayName = "DialogFooter";

const Title = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
    )
);
Title.displayName = DialogPrimitive.Title.displayName;

const Description = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
Description.displayName = DialogPrimitive.Description.displayName;

export { Close, CloseButton, Content, Description, Footer, Header, Overlay, Portal, Root, Title, Trigger };

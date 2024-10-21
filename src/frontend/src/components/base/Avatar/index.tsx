"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/core/utils/ComponentUtils";
import { tv, type VariantProps } from "tailwind-variants";

export const AvatarVariants = tv(
    {
        base: "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        variants: {
            size: {
                default: "h-10 w-10 text-base",
                sm: "h-8 w-8 text-xs",
                lg: "h-14 w-14 text-2xl",
                "2xl": "h-20 w-20 text-3xl",
            },
        },
        defaultVariants: {
            size: "default",
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface IAvatarProps extends AvatarPrimitive.AvatarProps, VariantProps<typeof AvatarVariants> {}

type TAvatarProps = React.ForwardRefExoticComponent<IAvatarProps & React.RefAttributes<HTMLSpanElement>>;

const Root = React.forwardRef<React.ElementRef<TAvatarProps>, React.ComponentPropsWithoutRef<TAvatarProps>>(({ className, size, ...props }, ref) => (
    <AvatarPrimitive.Root ref={ref} className={cn("select-none", AvatarVariants({ size, className }))} {...props} />
));
Root.displayName = AvatarPrimitive.Root.displayName;

const Image = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Image>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(
    ({ className, ...props }, ref) => <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
);
Image.displayName = AvatarPrimitive.Image.displayName;

const Fallback = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Fallback>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>>(
    ({ className, ...props }, ref) => {
        return (
            <AvatarPrimitive.Fallback
                ref={ref}
                className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
                {...props}
            />
        );
    }
);
Fallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Root, Image, Fallback };

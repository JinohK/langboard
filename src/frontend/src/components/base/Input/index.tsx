/* eslint-disable @/max-len */
import * as React from "react";
import { cn } from "@/core/utils/ComponentUtils";
import { tv, VariantProps } from "tailwind-variants";

export const InputVariants = tv(
    {
        base: "flex w-full rounded-md bg-background text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        defaultVariants: {
            h: "md",
            variant: "default",
        },
        variants: {
            h: {
                md: "h-10 px-3 py-2",
                sm: "h-[28px] px-1.5 py-1",
            },
            variant: {
                default: "border border-input ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                ghost: "border-none focus-visible:ring-transparent",
            },
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof InputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, h, variant, ...props }, ref) => {
    return <input type={type} className={cn(InputVariants({ h, variant }), className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

export default Input;

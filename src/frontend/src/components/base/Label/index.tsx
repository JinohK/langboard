"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";
import { DimensionMap, extractVariantProps, FlexMap, GapMap, MarginMap, PaddingMap, TextMap } from "@/core/utils/VariantUtils";
import { cn } from "@/core/utils/ComponentUtils";

export const LabelVariants = tv({
    base: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    variants: {
        direction: FlexMap.direction,
        wrap: FlexMap.wrap,
        items: FlexMap.items,
        justify: FlexMap.justify,
        gap: GapMap.all,
        gapX: GapMap.x,
        gapY: GapMap.y,
        w: DimensionMap.width,
        h: DimensionMap.height,
        size: DimensionMap.all,
        p: PaddingMap.all,
        pl: PaddingMap.left,
        pr: PaddingMap.right,
        pt: PaddingMap.top,
        pb: PaddingMap.bottom,
        px: PaddingMap.x,
        py: PaddingMap.y,
        m: MarginMap.all,
        ml: MarginMap.left,
        mr: MarginMap.right,
        mt: MarginMap.top,
        mb: MarginMap.bottom,
        mx: MarginMap.x,
        my: MarginMap.y,
        textSize: TextMap.size,
        flex: {
            true: "flex",
        },
        "inline-flex": {
            true: "inline-flex",
        },
    },
});

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof LabelVariants>
>(({ className, children, ...props }, ref) => {
    const variants = extractVariantProps(LabelVariants, props);
    return (
        <LabelPrimitive.Root ref={ref} className={cn(LabelVariants({ ...variants }), className)} {...props}>
            {children}
        </LabelPrimitive.Root>
    );
});
Label.displayName = LabelPrimitive.Root.displayName;

export default Label;

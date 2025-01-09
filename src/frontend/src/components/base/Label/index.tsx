"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";
import {
    BorderMap,
    CursorMap,
    DimensionMap,
    DisplayMap,
    extractVariantProps,
    FlexMap,
    GapMap,
    MarginMap,
    PaddingMap,
    PositionMap,
    TextMap,
} from "@/core/utils/VariantUtils";
import { cn } from "@/core/utils/ComponentUtils";

export const LabelVariants = tv({
    base: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    variants: {
        display: DisplayMap.all,
        direction: FlexMap.direction,
        wrap: FlexMap.wrap,
        items: FlexMap.items,
        justify: FlexMap.justify,
        gap: GapMap.all,
        gapX: GapMap.x,
        gapY: GapMap.y,
        w: DimensionMap.width,
        h: DimensionMap.height,
        maxW: DimensionMap.maxWidth,
        maxH: DimensionMap.maxHeight,
        minW: DimensionMap.minWidth,
        minH: DimensionMap.minHeight,
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
        weight: TextMap.weight,
        position: PositionMap.position,
        top: PositionMap.top,
        right: PositionMap.right,
        bottom: PositionMap.bottom,
        left: PositionMap.left,
        insetX: PositionMap.insetX,
        insetY: PositionMap.insetY,
        z: PositionMap.zIndex,
        cursor: CursorMap.all,
        border: BorderMap.width,
        rounded: BorderMap.rounded,
    },
});

const Label = React.forwardRef<
    React.ComponentRef<typeof LabelPrimitive.Root>,
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

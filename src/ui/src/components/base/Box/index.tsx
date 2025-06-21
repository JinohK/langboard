"use client";

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
import React, { forwardRef } from "react";

export const BoxVariants = tv(
    {
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
    },
    {
        responsiveVariants: true,
    }
);

type TComponentPropsWithout<
    T extends React.ElementType,
    O extends Omit<string, keyof React.ComponentPropsWithoutRef<T>> | keyof React.ComponentPropsWithoutRef<T>,
> = Omit<React.ComponentPropsWithoutRef<T>, O & string>;
type TRemovedProps = "asChild" | "defaultChecked" | "defaultValue" | "color";

interface IBaseBoxProps extends VariantProps<typeof BoxVariants> {}

interface IDivBoxProps extends IBaseBoxProps, TComponentPropsWithout<"div", TRemovedProps> {
    as?: "div";
}

interface ISpanBoxProps extends IBaseBoxProps, TComponentPropsWithout<"span", TRemovedProps> {
    as: "span";
}

export type TBoxProps = IDivBoxProps | ISpanBoxProps;

const Box = forwardRef<React.ComponentRef<"div">, TBoxProps>(({ as: Comp = "div", className, children, ...props }, ref) => {
    const variants = extractVariantProps(BoxVariants, props);
    return (
        <Comp ref={ref} className={cn(BoxVariants({ ...variants }), className)} {...props}>
            {children}
        </Comp>
    );
});

export default Box;

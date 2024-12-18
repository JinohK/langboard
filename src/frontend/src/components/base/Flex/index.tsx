import { cn } from "@/core/utils/ComponentUtils";
import {
    BorderMap,
    CursorMap,
    DimensionMap,
    extractVariantProps,
    FlexMap,
    GapMap,
    MarginMap,
    PaddingMap,
    PositionMap,
    TextMap,
} from "@/core/utils/VariantUtils";
import { forwardRef } from "react";
import { tv, VariantProps } from "tailwind-variants";

const FlexVariants = tv(
    {
        base: "flex",
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
            inline: {
                true: "inline-flex",
            },
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface IFlexProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof FlexVariants> {}

const Flex = forwardRef<HTMLDivElement, IFlexProps>(({ className, children, ...props }, ref) => {
    const variants = extractVariantProps(FlexVariants, props);
    return (
        <div ref={ref} className={cn(FlexVariants({ ...variants }), className)} {...props}>
            {children}
        </div>
    );
});

export default Flex;

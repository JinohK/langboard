import { cn } from "@/core/utils/ComponentUtils";
import { DimensionMap, extractVariantProps, FlexMap, GapMap, MarginMap, PaddingMap, TextMap } from "@/core/utils/VariantUtils";
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
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface IFlexProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof FlexVariants> {
    inline?: bool;
}

const Flex = forwardRef<HTMLDivElement, IFlexProps>(({ className, children, inline, ...props }, ref) => {
    const variants = extractVariantProps(FlexVariants, props);
    return (
        <div ref={ref} className={cn(FlexVariants({ ...variants }), inline ? "inline-flex" : "", className)} {...props}>
            {children}
        </div>
    );
});

export default Flex;

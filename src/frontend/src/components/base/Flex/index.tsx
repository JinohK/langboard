import { cn } from "@/core/utils/ComponentUtils";
import { extractVariantProps, FlexMap, GapMap, shardTailwindVariants } from "@/core/utils/VariantUtils";
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
            ...shardTailwindVariants,
        },
    },
    {
        responsiveVariants: true,
    }
);

export interface IFlexProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof FlexVariants> {
    inline?: boolean;
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

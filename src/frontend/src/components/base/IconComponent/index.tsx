import { ComponentPropsWithoutRef, ElementRef, ElementType, forwardRef, ForwardRefExoticComponent, lazy, memo, RefAttributes, SVGProps } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { icons } from "lucide-react";
import Flag from "react-flagkit";
import { cn } from "@/core/utils/ComponentUtils";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { tv, VariantProps } from "tailwind-variants";

export const IconVariants = tv(
    {
        variants: {
            size: {
                "1": "h-1 w-1",
                "2": "h-2 w-2",
                "3": "h-3 w-3",
                "4": "h-4 w-4",
                "5": "h-5 w-5",
                "6": "h-6 w-6",
                "7": "h-7 w-7",
                "8": "h-8 w-8",
                "9": "h-9 w-9",
                "10": "h-10 w-10",
                "11": "h-11 w-11",
                "12": "h-12 w-12",
                "14": "h-14 w-14",
            },
        },
        defaultVariants: {
            size: undefined,
        },
    },
    {
        responsiveVariants: true,
    }
);

type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ElementAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;
interface IIconProps extends ElementAttributes, VariantProps<typeof IconVariants> {
    icon: string;
}
type TIconProps = ForwardRefExoticComponent<IIconProps & RefAttributes<SVGSVGElement>>;

const IconComponent = memo(
    forwardRef<ElementRef<TIconProps>, ComponentPropsWithoutRef<TIconProps>>(({ icon, size, className, stroke, strokeWidth, id, ...props }, ref) => {
        if (size) {
            className = cn(IconVariants({ size }), className ?? "");
        }

        if (icon.includes("flag-")) {
            const country = icon.split("flag-").pop();

            return (
                <SuspenseComponent className={className}>
                    <Flag country={country} className={className} id={id} />
                </SuspenseComponent>
            );
        }

        let TargetIcon: ElementType = icons[icon as keyof typeof icons];
        if (!TargetIcon) {
            const dynamicIcon = dynamicIconImports[icon as keyof typeof dynamicIconImports];
            if (dynamicIcon) {
                TargetIcon = lazy(dynamicIcon);
            }
        }

        if (!TargetIcon) {
            return null;
        }

        const style = {
            strokeWidth: strokeWidth ?? 1.5,
            ...(stroke && { stroke: stroke }),
        };

        return (
            <SuspenseComponent className={className}>
                <TargetIcon className={className} style={style} ref={ref} id={id} {...props} />
            </SuspenseComponent>
        );
    })
);

export default IconComponent;

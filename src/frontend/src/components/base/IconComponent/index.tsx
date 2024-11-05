import { icons } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { ComponentPropsWithoutRef, ElementRef, ElementType, ForwardRefExoticComponent, RefAttributes, SVGProps, forwardRef, lazy, memo } from "react";
import Flag from "react-flagkit";
import { VariantProps, tv } from "tailwind-variants";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { cn } from "@/core/utils/ComponentUtils";

export const IconVariants = tv(
    {
        variants: {
            size: {
                "1": "size-1",
                "2": "size-2",
                "3": "size-3",
                "4": "size-4",
                "5": "size-5",
                "6": "size-6",
                "7": "size-7",
                "8": "size-8",
                "9": "size-9",
                "10": "size-10",
                "11": "size-11",
                "12": "size-12",
                "14": "size-14",
                full: "size-full",
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
            strokeWidth: strokeWidth,
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

import { icons } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { forwardRef, lazy, memo } from "react";
import Flag from "react-flagkit";
import { VariantProps, tv } from "tailwind-variants";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { cn } from "@/core/utils/ComponentUtils";
import { DimensionMap } from "@/core/utils/VariantUtils";

export const IconVariants = tv(
    {
        variants: {
            size: DimensionMap.all,
        },
        defaultVariants: {
            size: undefined,
        },
    },
    {
        responsiveVariants: true,
    }
);

type TSVGElementAttributes = React.RefAttributes<SVGSVGElement> & Partial<React.SVGProps<SVGSVGElement>>;
type TImageElementAttributes = React.RefAttributes<HTMLImageElement> & React.HTMLAttributes<HTMLImageElement>;

interface ICountryIconProps extends TImageElementAttributes, VariantProps<typeof IconVariants> {
    icon: `country-${string}`;
}

interface ILucideIconProps extends TSVGElementAttributes, VariantProps<typeof IconVariants> {
    icon: keyof typeof dynamicIconImports | (string & {});
}

export type TIconProps = React.ForwardRefExoticComponent<ICountryIconProps> | React.ForwardRefExoticComponent<ILucideIconProps>;

export type TIconName = ICountryIconProps["icon"] | ILucideIconProps["icon"];

const IconComponent = memo(
    forwardRef<React.ElementRef<TIconProps>, React.ComponentPropsWithoutRef<TIconProps>>(({ icon, size, className, id, ...props }, ref) => {
        if (size) {
            className = cn(IconVariants({ size }), className ?? "");
        }

        const isCountryIcon = (name: string): name is `country-${string}` => name.startsWith("country-");

        if (isCountryIcon(icon)) {
            const country = icon.split("country-").pop();

            return (
                <SuspenseComponent className={className}>
                    <Flag country={country} className={className} id={id} {...(props as React.HTMLAttributes<HTMLImageElement>)} />
                </SuspenseComponent>
            );
        }

        let TargetIcon: React.ElementType = icons[icon as keyof typeof icons];
        if (!TargetIcon) {
            const dynamicIcon = dynamicIconImports[icon as keyof typeof dynamicIconImports];
            if (dynamicIcon) {
                TargetIcon = lazy(dynamicIcon);
            }
        }

        if (!TargetIcon) {
            return null;
        }

        return (
            <SuspenseComponent className={className}>
                <TargetIcon className={className} ref={ref} id={id} {...props} />
            </SuspenseComponent>
        );
    })
);

export default IconComponent;

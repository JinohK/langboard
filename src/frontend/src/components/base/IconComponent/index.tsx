import { ElementType, forwardRef, lazy, memo, useEffect, useState } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { icons } from "lucide-react";
import Flag from "react-flagkit";
import SuspenseComponent from "@/components/base/SuspenseComponent";

export type TIconProps = {
    name: string;
    size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
    className?: string;
    iconColor?: string;
    onClick?: () => void;
    stroke?: string;
    strokeWidth?: number;
    id?: string;
};

const IconComponent = memo(
    forwardRef(({ name, size, className, iconColor, stroke, strokeWidth, id = "" }: TIconProps, ref) => {
        const [isLoading, setLoading] = useState(true);

        useEffect(() => {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 30);

            return () => clearTimeout(timer);
        }, []);

        let iconSize = "var(--default-font-size)";
        if (size) {
            iconSize = `var(--font-size-${size})`;
        }

        const sizeStyle = {
            width: iconSize,
            height: iconSize,
        };

        if (name.includes("flag-")) {
            const country = name.split("flag-").pop();

            return (
                <SuspenseComponent isLoading={isLoading} width={iconSize} height={iconSize}>
                    <Flag country={country} className={className} id={id} style={sizeStyle} />
                </SuspenseComponent>
            );
        }

        let TargetIcon: ElementType = icons[name as keyof typeof icons];
        if (!TargetIcon) {
            const dynamicIcon = dynamicIconImports[name as keyof typeof dynamicIconImports];
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
            ...(iconColor && { color: "var(--accent-a11)", stroke: stroke }),
            ...sizeStyle,
        };

        return (
            <SuspenseComponent isLoading={isLoading} width={iconSize} height={iconSize}>
                <TargetIcon className={className} style={style} ref={ref} id={id} data-accent-color={iconColor} />
            </SuspenseComponent>
        );
    })
);

export default IconComponent;

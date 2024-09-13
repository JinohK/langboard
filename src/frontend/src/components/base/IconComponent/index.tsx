import { ElementType, forwardRef, lazy, memo, useEffect, useState } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { icons } from "lucide-react";
import Flag from "react-flagkit";
import SuspenseComponent from "@/components/base/SuspenseComponent";

export type TIconProps = {
    name: string;
    size?: number;
    className?: string;
    iconColor?: string;
    onClick?: () => void;
    stroke?: string;
    strokeWidth?: number;
    id?: string;
};

const IconComponent = memo(
    forwardRef(({ name, size = 24, className, iconColor, stroke, strokeWidth, id = "" }: TIconProps, ref) => {
        const [isLoading, setLoading] = useState(true);

        useEffect(() => {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 30);

            return () => clearTimeout(timer);
        }, []);

        if (name.includes("flag-")) {
            const country = name.split("flag-").pop();

            return (
                <SuspenseComponent isLoading={isLoading} width={`${size}px`} height={`${size}px`}>
                    <Flag country={country} className={className} size={size} style={{ color: iconColor }} id={id} />
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
            ...(iconColor && { color: iconColor, stroke: stroke }),
        };

        return (
            <SuspenseComponent isLoading={isLoading} width={`${size}px`} height={`${size}px`}>
                <TargetIcon className={className} style={style} ref={ref} id={id} size={size} />
            </SuspenseComponent>
        );
    })
);

export default IconComponent;

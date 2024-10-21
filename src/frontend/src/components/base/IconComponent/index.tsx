import {
    ComponentPropsWithoutRef,
    ElementRef,
    ElementType,
    forwardRef,
    ForwardRefExoticComponent,
    lazy,
    memo,
    RefAttributes,
    SVGProps,
    useEffect,
    useState,
} from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { icons } from "lucide-react";
import Flag from "react-flagkit";
import { cn } from "@/core/utils/ComponentUtils";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { heightSizeMap, TDimensionSize, widthSizeMap } from "@/core/utils/SizeMap";

type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ElementAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;
interface IIconProps extends ElementAttributes {
    icon: string;
    size?: TDimensionSize;
}
type TIconProps = ForwardRefExoticComponent<IIconProps & RefAttributes<SVGSVGElement>>;

const IconComponent = memo(
    forwardRef<ElementRef<TIconProps>, ComponentPropsWithoutRef<TIconProps>>(({ icon, size, className, stroke, strokeWidth, id, ...props }, ref) => {
        const [isLoading, setIsLoading] = useState(true);

        if (size) {
            className = cn(widthSizeMap[size], heightSizeMap[size], className ?? "");
        }

        useEffect(() => {
            let timer: NodeJS.Timeout;

            const checkLoading = () => {
                if (!isLoading) {
                    return;
                }

                if (timer) {
                    clearTimeout(timer);
                }

                timer = setTimeout(checkLoading, 30);
            };

            checkLoading();

            return () => {
                if (timer) {
                    clearTimeout(timer);
                }
            };
        }, []);

        if (icon.includes("flag-")) {
            const country = icon.split("flag-").pop();

            return (
                <SuspenseComponent className={className}>
                    <Flag country={country} className={className} id={id} onLoad={() => setIsLoading(false)} onError={() => setIsLoading(false)} />
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
                <TargetIcon
                    className={className}
                    style={style}
                    ref={ref}
                    id={id}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                    {...props}
                />
            </SuspenseComponent>
        );
    })
);

export default IconComponent;

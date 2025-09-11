/// <reference types="vite-plugin-svgr/client" />
import svgIconMap, { TSVGIconMap } from "@/assets/svgs/icons";
import { Utils } from "@langboard/core/utils";
import { forwardRef, memo } from "react";

type TSVGElementAttributes = React.RefAttributes<SVGSVGElement> & Partial<React.SVGProps<SVGSVGElement>>;

interface IInternalIconProps extends TSVGElementAttributes {
    icon: string;
}

export type TInternalIconProps = React.ForwardRefExoticComponent<IInternalIconProps>;

export const InternalIcon = memo(
    forwardRef<React.ComponentRef<TInternalIconProps>, React.ComponentPropsWithoutRef<TInternalIconProps>>(({ icon, ...props }, ref) => {
        const pascalCaseIcon = new Utils.String.Case(icon).toPascal();
        const Component = svgIconMap[pascalCaseIcon as keyof TSVGIconMap];

        if (!Component) {
            return null;
        }

        return <Component ref={ref} {...props} />;
    })
);

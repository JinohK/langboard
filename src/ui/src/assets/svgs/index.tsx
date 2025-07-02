/// <reference types="vite-plugin-svgr/client" />
import LangflowIcon from "./LangflowIcon.svg?react";
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

        switch (pascalCaseIcon) {
            case "LangflowIcon":
                return <LangflowIcon ref={ref} {...props} />;
            default:
                return null;
        }
    })
);

export { LangflowIcon };

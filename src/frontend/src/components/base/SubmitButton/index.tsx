import { forwardRef } from "react";
import { IconComponent } from "@/components/base";
import Button, { ButtonProps } from "@/components/base/Button";
import { type TDimensionSize } from "@/core/utils/VariantUtils";

interface IBaseSubmitButtonProps extends ButtonProps {
    loadingIconSize?: TDimensionSize;
    isValidating: bool;
    children: React.ReactNode;
}

interface ISubmitButtonProps extends IBaseSubmitButtonProps {
    type: "submit";
}

interface IClickButtonProps extends IBaseSubmitButtonProps {
    type: "button";
    onClick: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}

export type TSubmitButtonProps = ISubmitButtonProps | IClickButtonProps;

const SubmitButton = forwardRef<HTMLButtonElement, TSubmitButtonProps>(
    ({ type, onClick, isValidating, loadingIconSize = "5", children, ...props }, ref) => (
        <Button type={type} onClick={onClick} disabled={isValidating} {...props} ref={ref}>
            {isValidating ? <IconComponent icon="loader-circle" size={loadingIconSize} strokeWidth="3" className="animate-spin" /> : children}
        </Button>
    )
);

export default SubmitButton;

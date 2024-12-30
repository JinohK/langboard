import { forwardRef } from "react";
import Button, { ButtonProps } from "@/components/base/Button";
import Loading, { ILoadingProps } from "@/components/base/Loading";

interface IBaseSubmitButtonProps extends ButtonProps {
    loadingProps?: Omit<ILoadingProps, "animate">;
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

const SubmitButton = forwardRef<HTMLButtonElement, TSubmitButtonProps>(({ type, onClick, isValidating, loadingProps, children, ...props }, ref) => (
    <Button type={type} onClick={onClick} disabled={isValidating} {...props} ref={ref}>
        {isValidating ? <Loading animate="pulse" size="2" spacing="0.5" {...(loadingProps ?? {})} /> : children}
    </Button>
));

export default SubmitButton;

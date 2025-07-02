import * as React from "react";
import * as Button from "@/components/base/Floating/Button";
import * as Form from "@/components/base/Form";
import BaseInput from "@/components/base/Input";
import BaseLabel from "@/components/base/Label";
import BaseTextarea, { type TextareaProps as BaseTextareaProps } from "@/components/base/Textarea";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export interface TextareaProps extends BaseTextareaProps {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
    return <BaseInput placeholder=" " className={cn("peer", className)} ref={ref} {...props} />;
});
Input.displayName = "FloatingInput";

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
    return <BaseTextarea placeholder=" " className={cn("peer", className)} ref={ref} {...props} />;
});
Textarea.displayName = "FloatingTextarea";

interface ILabelProps {
    isTextarea?: bool;
}

const Label = React.forwardRef<React.ComponentRef<typeof BaseLabel>, React.ComponentPropsWithoutRef<typeof BaseLabel> & ILabelProps>(
    ({ className, isTextarea, ...props }, ref) => {
        const classNames = cn(
            "peer-focus:secondary peer-focus:dark:secondary",
            "absolute start-2 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform cursor-text",
            "bg-background px-2 text-sm text-gray-500 duration-300 dark:bg-background",
            isTextarea ? "peer-placeholder-shown:top-7" : "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
            "peer-placeholder-shown:scale-100",
            "peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2",
            "rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4",
            className
        );

        return <BaseLabel className={classNames} ref={ref} {...props} />;
    }
);
Label.displayName = "FloatingLabel";

type LabelInputProps = InputProps & { wrapperClassNames?: string; label: string; isFormControl?: bool };

const LabelInput = React.forwardRef<React.ComponentRef<typeof Input>, React.PropsWithoutRef<LabelInputProps>>(
    ({ wrapperClassNames, label, isFormControl, id, ...props }, ref) => {
        id = id ?? `floating-input-${Utils.String.Token.shortUUID()}`;

        let comp = <Input id={id} ref={ref} {...props} />;
        if (isFormControl) {
            comp = <Form.Control asChild>{comp}</Form.Control>;
        }

        return (
            <div className={cn("relative", wrapperClassNames)}>
                {comp}
                <Label className="select-none" htmlFor={id}>
                    {label}
                </Label>
            </div>
        );
    }
);
LabelInput.displayName = "FloatingLabelInput";

type LabelTextareaProps = BaseTextareaProps & { wrapperClassNames?: string; label: string; isFormControl?: bool };

const LabelTextarea = React.forwardRef<React.ComponentRef<typeof Textarea>, React.PropsWithoutRef<LabelTextareaProps>>(
    ({ wrapperClassNames, label, isFormControl, id, ...props }, ref) => {
        id = id ?? `floating-textarea-${Utils.String.Token.shortUUID()}`;

        let comp = <Textarea id={id} ref={ref} {...props} />;
        if (isFormControl) {
            comp = <Form.Control asChild>{comp}</Form.Control>;
        }

        return (
            <div className={cn("relative", wrapperClassNames)}>
                {comp}
                <Label className="select-none" htmlFor={id} isTextarea>
                    {label}
                </Label>
            </div>
        );
    }
);
LabelTextarea.displayName = "FloatingLabelTextarea";

export { Button, Input, Label, LabelInput, LabelTextarea, Textarea };

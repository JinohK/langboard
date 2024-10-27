import * as React from "react";
import BaseInput from "@/components/base/Input";
import BaseLabel from "@/components/base/Label";
import { cn } from "@/core/utils/ComponentUtils";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
    return <BaseInput placeholder=" " className={cn("peer", className)} ref={ref} {...props} />;
});
Input.displayName = "FloatingInput";

const Label = React.forwardRef<React.ElementRef<typeof BaseLabel>, React.ComponentPropsWithoutRef<typeof BaseLabel>>(
    ({ className, ...props }, ref) => {
        return (
            <BaseLabel
                className={cn(
                    // eslint-disable-next-line @/max-len
                    "peer-focus:secondary peer-focus:dark:secondary absolute start-2 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform cursor-text bg-background px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 dark:bg-background rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Label.displayName = "FloatingLabel";

type LabelInputProps = InputProps & { label?: string };

const LabelInput = React.forwardRef<React.ElementRef<typeof Input>, React.PropsWithoutRef<LabelInputProps>>(({ id, label, ...props }, ref) => {
    return (
        <div className="relative">
            <Input ref={ref} id={id} {...props} />
            <Label htmlFor={id}>{label}</Label>
        </div>
    );
});
LabelInput.displayName = "FloatingLabelInput";

export { Input, Label, LabelInput };

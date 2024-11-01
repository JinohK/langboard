import { Floating, Form, IconComponent } from "@/components/base";
import FormErrorMessage from "@/components/FormErrorMessage";
import { cn } from "@/core/utils/ComponentUtils";
import { useState } from "react";

interface IBasePasswordInputProps {
    name: string;
    label: string;
    autoFocus?: boolean;
    className?: string;
    isFormControl?: boolean;
    isValidating?: boolean;
    autoComplete?: string;
    defaultValue?: string;
    error?: string;
}

interface IFormPasswordInputProps extends IBasePasswordInputProps {
    isFormControl: true;
    isValidating: boolean;
}

interface IUnformedPasswordInputProps extends IBasePasswordInputProps {
    isFormControl?: false;
    error?: undefined;
}

export type TPasswordInputProps = IFormPasswordInputProps | IUnformedPasswordInputProps;

function PasswordInput({
    name,
    label,
    autoFocus,
    className,
    isFormControl,
    isValidating,
    autoComplete = "off",
    defaultValue,
    error,
}: TPasswordInputProps): JSX.Element {
    const [shouldShow, setShouldShow] = useState(false);

    const comp = (
        <div className={cn("relative", className)}>
            <Floating.LabelInput
                type={shouldShow ? "text" : "password"}
                name={name}
                label={label}
                autoFocus={autoFocus}
                isFormControl={isFormControl}
                className="pr-10"
                autoComplete={autoComplete}
                disabled={isValidating}
                defaultValue={defaultValue}
            />
            <IconComponent
                icon={shouldShow ? "eye-off" : "eye"}
                className="absolute right-2 top-1/2 -translate-y-1/2 transform cursor-pointer transition-all [&:not(:hover)]:text-gray-600"
                onClick={() => setShouldShow(!shouldShow)}
            />
        </div>
    );

    if (isFormControl) {
        return (
            <Form.Field name={name}>
                {comp}
                {error && <FormErrorMessage error={error} />}
            </Form.Field>
        );
    } else {
        return comp;
    }
}

export default PasswordInput;

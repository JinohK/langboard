import { ISignUpForm } from "@/controllers/signup/useSignUp";

export interface ISignUpFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Record<keyof ISignUpForm, any>;
    validateForm: (
        formElement: HTMLFormElement,
        setIsValidating: (isValidating: boolean) => void
    ) => {
        form: Record<keyof ISignUpForm | "password-confirm", string>;
        formInputs: Required<Record<keyof ISignUpForm | "password-confirm", HTMLInputElement>>;
        newErrors: Partial<Record<keyof ISignUpForm | "password-confirm", JSX.Element | null>>;
        focusElement: HTMLInputElement | null;
        setValidation: (isValidating: boolean) => void;
    };
    nextStep: (newValues: Partial<ISignUpForm>, nextPath: string) => void;
}

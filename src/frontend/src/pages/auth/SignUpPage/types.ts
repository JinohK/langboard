import { ISignUpForm } from "@/controllers/auth/useSignUp";

export interface ISignUpFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Record<keyof ISignUpForm, any>;
    moveStep: (newValues: Partial<ISignUpForm>, nextPath: string, initialErrors?: Record<string, string>) => void;
    initialErrorsRef: React.MutableRefObject<Record<string, string>>;
}

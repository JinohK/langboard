import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormOnlyLayout } from "@/components/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { ISignUpForm } from "@/controllers/signup/useSignUp";
import OptionalForm from "@/pages/SignUpPage/OptionalForm";
import RequiredForm from "@/pages/SignUpPage/RequiredForm";
import Overview from "@/pages/SignUpPage/Overview";
import { Button } from "@/components/base";
import { EMAIL_REGEX } from "@/constants";
import AdditionalForm from "@/pages/SignUpPage/AdditionalForm";
import FormErrorMessage from "@/components/FormErrorMessage";

function SignUpPage(): JSX.Element {
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState<JSX.Element>();
    const values = location.state ?? {};

    const nextStep = (newValues: Partial<ISignUpForm>, nextUrl: string) => {
        const searchParams = new URLSearchParams(location.search);

        delete (newValues as Record<string, unknown>)["password-confirm"];
        location.state = { ...location.state, ...newValues };
        navigate(location, { replace: true, state: location.state });
        navigate(`${nextUrl}?${searchParams.toString()}`, { state: location.state });
    };

    const backToSignIn = () => {
        const searchParams = new URLSearchParams(location.search);
        navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`);
    };

    const validateForm = (formElement: HTMLFormElement, setIsValidating: (isValidating: boolean) => void) => {
        const backToEmailBtn = document.querySelector<HTMLButtonElement>("#back-to-sign-in-btn")!;

        const setValidation = (isValidating: boolean) => {
            setIsValidating(isValidating);
            backToEmailBtn.disabled = isValidating;
        };

        setValidation(true);

        const inputNames: (keyof ISignUpForm | "password-confirm")[] = [
            "email",
            "firstname",
            "lastname",
            "password",
            "password-confirm",
            "industry",
            "purpose",
        ];

        const form: Partial<Record<keyof ISignUpForm | "password-confirm", string>> = {};
        const formInputs: Partial<Record<keyof ISignUpForm | "password-confirm", HTMLInputElement>> = {};
        const newErrors: Partial<Record<keyof ISignUpForm | "password-confirm", JSX.Element | null>> = {};
        let focusElement: HTMLInputElement | null = null;

        for (let i = 0; i < inputNames.length; ++i) {
            const inputName = inputNames[i];
            const input = formElement[inputName];

            if (!input) {
                continue;
            }

            const isSelectedOther = formElement[inputName] instanceof RadioNodeList;
            let value = formElement[inputName].value;
            if (isSelectedOther) {
                if (formElement[inputName][0] instanceof HTMLSelectElement) {
                    value = (formElement[inputName][1] as HTMLInputElement).value;
                }
            }

            formInputs[inputName] = input;
            form[inputName] = value;

            if (!value) {
                newErrors[inputName] = (
                    <FormErrorMessage error={`signUp.errors.missing.${inputName}${isSelectedOther ? "-other" : ""}`} icon="circle-alert" />
                );
                if (!focusElement) {
                    focusElement = input;
                }
            } else if (inputName === "email" && !EMAIL_REGEX.test(value)) {
                newErrors.email = <FormErrorMessage error="signUp.errors.invalid.email" icon="circle-alert" />;
                if (!focusElement) {
                    focusElement = input;
                }
            }
        }

        return {
            form: form as Record<keyof ISignUpForm | "password-confirm", string>,
            formInputs: formInputs as Required<typeof formInputs>,
            newErrors,
            focusElement,
            setValidation,
        };
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        switch (location.pathname) {
            case ROUTES.SIGN_UP.REQUIRED:
                setForm(<RequiredForm values={values} validateForm={validateForm} nextStep={nextStep} />);
                break;
            case ROUTES.SIGN_UP.ADDITIONAL: {
                const inputNames: (keyof ISignUpForm)[] = ["email", "firstname", "lastname", "password"];
                for (let i = 0; i < inputNames.length; ++i) {
                    if (!values[inputNames[i]]) {
                        navigate(`${ROUTES.SIGN_UP.REQUIRED}?${searchParams.toString()}`);
                        return;
                    }
                }
                setForm(<AdditionalForm values={values} validateForm={validateForm} nextStep={nextStep} />);
                break;
            }
            case ROUTES.SIGN_UP.OPTIONAL: {
                const inputNames: (keyof ISignUpForm)[] = ["email", "firstname", "lastname", "password", "industry", "purpose"];
                for (let i = 0; i < inputNames.length; ++i) {
                    if (!values[inputNames[i]]) {
                        navigate(`${ROUTES.SIGN_UP.REQUIRED}?${searchParams.toString()}`);
                        return;
                    }
                }
                setForm(<OptionalForm values={values} nextStep={nextStep} />);
                break;
            }
            case ROUTES.SIGN_UP.OVERVIEW: {
                const inputNames: (keyof ISignUpForm)[] = ["email", "firstname", "lastname", "password", "industry", "purpose"];
                for (let i = 0; i < inputNames.length; ++i) {
                    if (!values[inputNames[i]]) {
                        navigate(`${ROUTES.SIGN_UP.REQUIRED}?${searchParams.toString()}`);
                        return;
                    }
                }
                setForm(<Overview values={values} nextStep={nextStep} />);
                break;
            }
        }
    }, [navigate, location]);

    const leftSide = (
        <>
            <h2 className="text-4xl font-normal">{t("signUp.Sign up")}</h2>
            <span className="text-sm sm:text-base">{t("signUp.Already have an account?")}</span>
            <Button
                id="back-to-sign-in-btn"
                type="button"
                variant="ghost"
                size={{
                    initial: "sm",
                    sm: "default",
                }}
                className="ml-2 mt-4"
                onClick={backToSignIn}
            >
                {t("signIn.Sign in")}
            </Button>
        </>
    );

    return <FormOnlyLayout size="sm" useLogo leftSide={leftSide} rightSide={form} />;
}

export default SignUpPage;

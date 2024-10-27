import { Button, Form, IconComponent, Input } from "@/components/base";
import { ROUTES } from "@/core/routing/constants";
import { ISignUpForm } from "@/controllers/signup/useSignUp";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useSignUpExistsEmail from "@/controllers/signup/useSignUpExistsEmail";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import FormErrorMessage from "@/components/FormErrorMessage";

function RequiredForm({ values, validateForm, nextStep }: ISignUpFormProps): JSX.Element {
    const { t } = useTranslation();
    const { mutate: existsEmailMutate } = useSignUpExistsEmail();
    const [[shouldShowPw, shouldShowConfirmPw], setShouldShowPasswords] = useState<[boolean, boolean]>([false, false]);
    const [isValidating, setIsValidating] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ISignUpForm | "password-confirm", JSX.Element | null>>>({});

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const { form, formInputs, newErrors, focusElement, setValidation } = validateForm(event.currentTarget, setIsValidating);

        if (focusElement) {
            setValidation(false);
            setErrors(newErrors);
            focusElement.focus();
            return;
        }

        if (form.password !== form["password-confirm"]) {
            newErrors["password-confirm"] = <FormErrorMessage error="signUp.errors.invalid.password-confirm" icon="circle-alert" />;
            setValidation(false);
            formInputs["password-confirm"].focus();
            setErrors(newErrors);
            return;
        }

        existsEmailMutate(
            { email: form.email! },
            {
                onSuccess: (data) => {
                    if (data.exists) {
                        setErrors({ email: <FormErrorMessage error="signUp.errors.invalid.email-exists" icon="circle-alert" /> });
                        formInputs.email.focus();
                        return;
                    }

                    nextStep(form as unknown as ISignUpForm, ROUTES.SIGN_UP.ADDITIONAL);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setValidation(false);
                },
            }
        );
    };

    const showIconClassName = "absolute right-2 top-1/2 -translate-y-1/2 transform cursor-pointer [&:not(:hover)]:text-gray-600 transition-all";

    return (
        <Form.Root className="flex flex-col gap-4 max-xs:mt-11" onSubmit={submitForm}>
            <Form.Field name="email">
                <Form.Control asChild>
                    <Input
                        className="w-full"
                        placeholder={t("signUp.Email")}
                        autoFocus
                        autoComplete="email"
                        disabled={isValidating}
                        defaultValue={values.email ?? ""}
                    />
                </Form.Control>
                {errors.email}
            </Form.Field>
            <Form.Field name="firstname">
                <Form.Control asChild>
                    <Input
                        className="w-full"
                        placeholder={t("signUp.First Name")}
                        autoComplete="firstname"
                        disabled={isValidating}
                        defaultValue={values.firstname ?? ""}
                    />
                </Form.Control>
                {errors.firstname}
            </Form.Field>
            <Form.Field name="lastname">
                <Form.Control asChild>
                    <Input
                        className="w-full"
                        placeholder={t("signUp.Last Name")}
                        autoComplete="lastname"
                        disabled={isValidating}
                        defaultValue={values.lastname ?? ""}
                    />
                </Form.Control>
                {errors.lastname}
            </Form.Field>
            <Form.Field name="password">
                <div className="relative">
                    <Form.Control asChild>
                        <Input
                            type={shouldShowPw ? "text" : "password"}
                            className="w-full pr-10"
                            placeholder={t("signUp.Password")}
                            autoComplete="off"
                            disabled={isValidating}
                            defaultValue={values.password ?? ""}
                        />
                    </Form.Control>
                    <IconComponent
                        icon={shouldShowPw ? "eye-off" : "eye"}
                        className={showIconClassName}
                        onClick={() => setShouldShowPasswords([!shouldShowPw, shouldShowConfirmPw])}
                    />
                </div>
                {errors.password}
            </Form.Field>
            <Form.Field name="password-confirm">
                <div className="relative">
                    <Form.Control asChild>
                        <Input
                            type={shouldShowConfirmPw ? "text" : "password"}
                            className="w-full pr-10"
                            placeholder={t("signUp.Confirm password")}
                            autoComplete="off"
                            disabled={isValidating}
                            defaultValue={values.password ?? ""}
                        />
                    </Form.Control>
                    <IconComponent
                        icon={shouldShowConfirmPw ? "eye-off" : "eye"}
                        className={showIconClassName}
                        onClick={() => setShouldShowPasswords([shouldShowPw, !shouldShowConfirmPw])}
                    />
                </div>
                {errors["password-confirm"]}
            </Form.Field>
            <div className="mt-16 flex items-center gap-8 max-xs:justify-end xs:justify-end">
                <Button type="submit" disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                </Button>
            </div>
        </Form.Root>
    );
}

export default RequiredForm;

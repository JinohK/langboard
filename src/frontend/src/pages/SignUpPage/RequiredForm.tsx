import { Button, Floating, Form, IconComponent } from "@/components/base";
import { ROUTES } from "@/core/routing/constants";
import { ISignUpFormProps } from "@/pages/SignUpPage/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useSignUpExistsEmail from "@/controllers/signup/useSignUpExistsEmail";
import FormErrorMessage from "@/components/FormErrorMessage";
import useForm from "@/core/hooks/form/useForm";
import { setInitialErrorsWithFocusingElement } from "@/pages/SignUpPage/utils";
import TypeUtils from "@/core/utils/TypeUtils";

function RequiredForm({ values, moveStep, initialErrorsRef }: ISignUpFormProps): JSX.Element {
    const { t } = useTranslation();
    const { mutate: existsEmailMutate } = useSignUpExistsEmail();
    const [[shouldShowPw, shouldShowConfirmPw], setShouldShowPasswords] = useState<[bool, bool]>([false, false]);
    const { errors, setErrors, isValidating, handleSubmit, formRef, formDataRef, focusElementRef } = useForm({
        errorLangPrefix: "signUp.errors",
        schema: {
            email: { required: true, email: true },
            firstname: { required: true },
            lastname: { required: true },
            password: { required: true },
            "password-confirm": { required: true, sameWith: "password" },
        },
        mutate: existsEmailMutate,
        mutateOnSuccess: (data) => {
            if (data.exists) {
                setErrors({ email: "signUp.errors.invalid.email-exists" });
                if (TypeUtils.isElement(focusElementRef.current)) {
                    focusElementRef.current.focus();
                } else if (TypeUtils.isString(focusElementRef.current)) {
                    formRef.current?.[focusElementRef.current]?.focus();
                }
                return;
            }

            moveStep(
                {
                    ...values,
                    ...formDataRef.current,
                },
                ROUTES.SIGN_UP.ADDITIONAL
            );
        },
        useDefaultBadRequestHandler: true,
    });

    useEffect(() => {
        setInitialErrorsWithFocusingElement(["email", "firstname", "lastname", "password"], initialErrorsRef, setErrors, formRef);
    }, []);

    const showIconClassName = "absolute right-2 top-1/2 -translate-y-1/2 transform cursor-pointer [&:not(:hover)]:text-gray-600 transition-all";

    return (
        <Form.Root className="flex flex-col gap-4 max-xs:mt-11" onSubmit={handleSubmit} ref={formRef}>
            <Form.Field name="email">
                <Floating.LabelInput
                    label={t("user.Email")}
                    isFormControl
                    autoFocus
                    autoComplete="email"
                    disabled={isValidating}
                    defaultValue={values.email ?? ""}
                />
                {errors.email && <FormErrorMessage error={errors.email} icon="circle-alert" />}
            </Form.Field>
            <Form.Field name="firstname">
                <Floating.LabelInput
                    label={t("user.First Name")}
                    isFormControl
                    autoComplete="firstname"
                    disabled={isValidating}
                    defaultValue={values.firstname ?? ""}
                />
                {errors.firstname && <FormErrorMessage error={errors.firstname} icon="circle-alert" />}
            </Form.Field>
            <Form.Field name="lastname">
                <Floating.LabelInput
                    label={t("user.Last Name")}
                    isFormControl
                    autoComplete="lastname"
                    disabled={isValidating}
                    defaultValue={values.lastname ?? ""}
                />
                {errors.lastname && <FormErrorMessage error={errors.lastname} icon="circle-alert" />}
            </Form.Field>
            <Form.Field name="password">
                <div className="relative">
                    <Floating.LabelInput
                        type={shouldShowPw ? "text" : "password"}
                        label={t("user.Password")}
                        isFormControl
                        className="pr-10"
                        autoComplete="off"
                        disabled={isValidating}
                        defaultValue={values.password ?? ""}
                    />
                    <IconComponent
                        icon={shouldShowPw ? "eye-off" : "eye"}
                        className={showIconClassName}
                        onClick={() => setShouldShowPasswords([!shouldShowPw, shouldShowConfirmPw])}
                    />
                </div>
                {errors.password && <FormErrorMessage error={errors.password} icon="circle-alert" />}
            </Form.Field>
            <Form.Field name="password-confirm">
                <div className="relative">
                    <Floating.LabelInput
                        type={shouldShowConfirmPw ? "text" : "password"}
                        label={t("signUp.Confirm password")}
                        isFormControl
                        className="pr-10"
                        autoComplete="off"
                        disabled={isValidating}
                        defaultValue={values.password ?? ""}
                    />
                    <IconComponent
                        icon={shouldShowConfirmPw ? "eye-off" : "eye"}
                        className={showIconClassName}
                        onClick={() => setShouldShowPasswords([shouldShowPw, !shouldShowConfirmPw])}
                    />
                </div>
                {errors["password-confirm"] && <FormErrorMessage error={errors["password-confirm"]} icon="circle-alert" />}
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

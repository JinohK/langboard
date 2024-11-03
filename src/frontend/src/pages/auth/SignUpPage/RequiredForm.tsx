import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import PasswordInput from "@/components/PasswordInput";
import { Button, Floating, Form, IconComponent } from "@/components/base";
import useSignUpExistsEmail from "@/controllers/auth/useSignUpExistsEmail";
import useForm from "@/core/hooks/form/useForm";
import { ROUTES } from "@/core/routing/constants";
import TypeUtils from "@/core/utils/TypeUtils";
import { ISignUpFormProps } from "@/pages/auth/SignUpPage/types";
import { setInitialErrorsWithFocusingElement } from "@/pages/auth/SignUpPage/utils";

function RequiredForm({ values, moveStep, initialErrorsRef }: ISignUpFormProps): JSX.Element {
    const { t } = useTranslation();
    const { mutate: existsEmailMutate } = useSignUpExistsEmail();
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
            <PasswordInput
                name="password"
                label={t("user.Password")}
                isFormControl
                isValidating={isValidating}
                defaultValue={values.password}
                error={errors.password}
            />
            <PasswordInput
                name="password-confirm"
                label={t("signUp.Confirm password")}
                isFormControl
                isValidating={isValidating}
                defaultValue={values.password}
                error={errors["password-confirm"]}
            />
            <div className="mt-16 flex items-center gap-8 max-xs:justify-end xs:justify-end">
                <Button type="submit" disabled={isValidating}>
                    {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                </Button>
            </div>
        </Form.Root>
    );
}

export default RequiredForm;

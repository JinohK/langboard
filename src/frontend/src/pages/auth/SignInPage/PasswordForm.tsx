import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Button, Checkbox, Floating, Form, IconComponent, Label } from "@/components/base";
import useSignIn from "@/controllers/auth/useSignIn";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { useAuth } from "@/core/providers/AuthProvider";
import { REDIRECT_QUERY_NAME, ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EMAIL_TOKEN_QUERY_NAME } from "@/pages/auth/SignInPage/constants";

export interface IPasswordformProps {
    signToken: string;
    emailToken: string;
    email: string;
    setEmail: (email: string) => void;
    className: string;
}

function PasswordForm({ signToken, emailToken, email, setEmail, className }: IPasswordformProps): JSX.Element {
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [shouldShowPassword, setShouldShowPassword] = useState(false);
    const { mutate } = useSignIn();
    const { signIn } = useAuth();
    const { errors, setErrors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "signIn.errors",
        schema: {
            password: { required: true },
        },
        predefineValues: { sign_token: signToken, email_token: emailToken },
        mutate,
        mutateOnSuccess: (data) => {
            if (!data.access_token || !data.refresh_token) {
                setErrors({ password: "signIn.errors.Couldn't find your {app} Account" });
                setTimeout(() => {
                    formRef.current!.password.focus();
                }, 0);
                return;
            }

            const searchParams = new URLSearchParams(location.search);
            const redirectUrl = searchParams.get(REDIRECT_QUERY_NAME) ?? ROUTES.AFTER_SIGN_IN;
            signIn(data.access_token, data.refresh_token);
            navigate(decodeURIComponent(redirectUrl));
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                setErrors({ password: "signIn.errors.invalid.password" });
                setTimeout(() => {
                    formRef.current!.password.focus();
                }, 0);
            },
        },
        useDefaultBadRequestHandler: true,
    });

    const backToEmail = () => {
        setEmail("");
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete(EMAIL_TOKEN_QUERY_NAME);
        navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`);
    };

    const toFindPassword = () => {
        const searchParams = new URLSearchParams(location.search);

        navigate(`${ROUTES.ACCOUNT_RECOVERY.NAME}?${searchParams.toString()}`, { state: { email } });
    };

    return (
        <>
            <div className={className}>
                <h2 className="text-4xl font-normal">{t("signIn.Welcome")}</h2>
                <Button
                    type="button"
                    id="back-to-email-btn"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={backToEmail}
                    title="Sign in with another email"
                    disabled={isValidating}
                >
                    {email}
                </Button>
            </div>
            <Form.Root className={cn("max-xs:mt-11", className)} onSubmit={handleSubmit} ref={formRef}>
                <Form.Field name="password">
                    <Floating.LabelInput
                        type={shouldShowPassword ? "text" : "password"}
                        label={t("user.Password")}
                        isFormControl
                        autoFocus
                        autoComplete="password"
                        disabled={isValidating}
                    />
                    {errors.password && <FormErrorMessage error={errors.password} icon="circle-alert" />}
                </Form.Field>
                <Label className="mt-3 flex cursor-pointer select-none gap-2">
                    <Checkbox onClick={() => setShouldShowPassword((prev) => !prev)} disabled={isValidating} />
                    {t("signIn.Show password")}
                </Label>
                <div className="mt-8 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                    <Button type="button" variant="ghost" disabled={isValidating} onClick={toFindPassword}>
                        {t("signIn.Forgot password?")}
                    </Button>
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : t("common.Next")}
                    </Button>
                </div>
            </Form.Root>
        </>
    );
}

export default PasswordForm;

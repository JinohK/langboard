import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { QUERY_NAMES } from "@/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Box, Button, Checkbox, Flex, Floating, Form, Label, SubmitButton } from "@/components/base";
import useSignIn from "@/controllers/api/auth/useSignIn";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { useNavigate } from "react-router-dom";

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
        errorLangPrefix: "auth.errors",
        schema: {
            password: { required: true },
        },
        predefineValues: { sign_token: signToken, email_token: emailToken },
        mutate,
        mutateOnSuccess: (data) => {
            if (!data.access_token) {
                setErrors({ password: "errors.requests.VA1001" });
                setTimeout(() => {
                    formRef.current!.password.focus();
                }, 0);
                return;
            }

            const searchParams = new URLSearchParams(location.search);
            const redirectUrl = searchParams.get(QUERY_NAMES.REDIRECT) ?? ROUTES.AFTER_SIGN_IN;
            signIn(data.access_token, () => navigate(decodeURIComponent(redirectUrl)));
        },
        apiErrorHandlers: {
            [EHttpStatus.HTTP_404_NOT_FOUND]: {
                after: (message) => {
                    setErrors({ password: message as string });
                    setTimeout(() => {
                        formRef.current!.password.focus();
                    }, 0);
                },
                toast: false,
            },
            [EHttpStatus.HTTP_406_NOT_ACCEPTABLE]: {
                after: () => {
                    setEmail("");
                    const searchParams = new URLSearchParams(location.search);
                    searchParams.delete(QUERY_NAMES.EMAIL_TOKEN);
                    navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`, { replace: true });
                },
            },
            [EHttpStatus.HTTP_423_LOCKED]: {
                after: () => {
                    navigate(ROUTES.SIGN_UP.COMPLETE, { state: { email } });
                },
            },
        },
        useDefaultBadRequestHandler: true,
    });

    const backToEmail = () => {
        setEmail("");
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete(QUERY_NAMES.EMAIL_TOKEN);
        navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`);
    };

    const toFindPassword = () => {
        const searchParams = new URLSearchParams(location.search);

        navigate(`${ROUTES.ACCOUNT_RECOVERY.NAME}?${searchParams.toString()}`, { state: { email } });
    };

    return (
        <>
            <Box className={className}>
                <h2 className="text-4xl font-normal">{t("auth.Welcome")}</h2>
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
            </Box>
            <Form.Root className={cn("mt-11 xs:mt-0", className)} onSubmit={handleSubmit} ref={formRef}>
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
                <Label display="flex" mt="3" gap="2" cursor="pointer" className="select-none">
                    <Checkbox onClick={() => setShouldShowPassword((prev) => !prev)} disabled={isValidating} />
                    {t("auth.Show password")}
                </Label>
                <Flex items="center" gap="8" justify={{ initial: "between", xs: "end" }} mt="16">
                    <Button type="button" variant="ghost" disabled={isValidating} onClick={toFindPassword}>
                        {t("auth.Forgot password?")}
                    </Button>
                    <SubmitButton type="submit" isValidating={isValidating}>
                        {t("common.Next")}
                    </SubmitButton>
                </Flex>
            </Form.Root>
        </>
    );
}

export default PasswordForm;

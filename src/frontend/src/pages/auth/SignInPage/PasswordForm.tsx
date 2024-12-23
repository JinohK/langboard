import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Box, Button, Checkbox, Flex, Floating, Form, Label, SubmitButton, Toast } from "@/components/base";
import useSignIn from "@/controllers/api/auth/useSignIn";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import useForm from "@/core/hooks/form/useForm";
import { useAuth } from "@/core/providers/AuthProvider";
import { REDIRECT_QUERY_NAME, ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { EMAIL_TOKEN_QUERY_NAME } from "@/pages/auth/SignInPage/constants";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import usePageNavigate from "@/core/hooks/usePageNavigate";

export interface IPasswordformProps {
    signToken: string;
    emailToken: string;
    email: string;
    setEmail: (email: string) => void;
    className: string;
}

function PasswordForm({ signToken, emailToken, email, setEmail, className }: IPasswordformProps): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = usePageNavigate();
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
            [EHttpStatus.HTTP_406_NOT_ACCEPTABLE]: () => {
                Toast.Add.error(t("signIn.errors.Email is not verified yet."));
                setEmail("");
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete(EMAIL_TOKEN_QUERY_NAME);
                navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`, { replace: true });
            },
            [EHttpStatus.HTTP_423_LOCKED]: () => {
                navigate(ROUTES.SIGN_UP.COMPLETE, { state: { email } });
            },
        },
        useDefaultBadRequestHandler: true,
    });

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

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
            <Box className={className}>
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
                    {t("signIn.Show password")}
                </Label>
                <Flex items="center" gap="8" justify={{ initial: "between", xs: "end" }} mt="16">
                    <Button type="button" variant="ghost" disabled={isValidating} onClick={toFindPassword}>
                        {t("signIn.Forgot password?")}
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

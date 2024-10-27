import { Button, Form, Checkbox, Input, Label } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import useSignIn from "@/controllers/auth/useSignIn";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { IconComponent } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { REDIRECT_QUERY_NAME, ROUTES } from "@/core/routing/constants";
import { EMAIL_TOKEN_QUERY_NAME } from "@/pages/SignInPage/constants";
import { cn } from "@/core/utils/ComponentUtils";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import FormErrorMessage from "@/components/FormErrorMessage";

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
    const [error, setError] = useState("");
    const { mutate } = useSignIn();
    const { signIn } = useAuth();
    const [isValidating, setIsValidating] = useState(false);

    const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        const passwordInput = event.currentTarget.password;
        const password = passwordInput.value;

        if (!password) {
            setError("signIn.errors.missing.password");
            setIsValidating(false);
            passwordInput.focus();
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const redirectUrl = searchParams.get(REDIRECT_QUERY_NAME) ?? ROUTES.AFTER_SIGN_IN;

        mutate(
            { sign_token: signToken, email_token: emailToken, password },
            {
                onSuccess: (data) => {
                    if (!data.access_token || !data.refresh_token) {
                        setError("signIn.errors.Couldn't find your {app} Account");
                        return;
                    }

                    signIn(data.access_token, data.refresh_token);
                    navigate(decodeURIComponent(redirectUrl));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_400_BAD_REQUEST]: () => {
                            setError("signIn.errors.missing.password");
                            passwordInput.focus();
                        },
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            setError("signIn.errors.invalid.password");
                            passwordInput.focus();
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    const backToEmail = () => {
        setIsValidating(false);
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
            <Form.Root className={cn("max-xs:mt-11", className)} onSubmit={submitPassword}>
                <Form.Field name="password">
                    <Form.Control asChild>
                        <Input
                            type={shouldShowPassword ? "text" : "password"}
                            className="w-full"
                            placeholder={t("signIn.Password")}
                            autoFocus
                            autoComplete="password"
                            disabled={isValidating}
                        />
                    </Form.Control>
                    {error && <FormErrorMessage error={error} icon="circle-alert" />}
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

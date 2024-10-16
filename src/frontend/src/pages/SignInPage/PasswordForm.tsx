import { Button, Form, Checkbox, Input, Label } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import useSignIn from "@/controllers/auth/useSignIn";
import { isAxiosError } from "axios";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { IconComponent } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { REDIRECT_QUERY_NAME } from "@/controllers/constants";
import { EMAIL_TOKEN_NAME } from "@/pages/SignInPage/constants";

export interface IPasswordformProps {
    signToken: string;
    emailToken: string;
    email: string;
    setEmail: (email: string) => void;
}

function PasswordForm({ signToken, emailToken, email, setEmail }: IPasswordformProps): JSX.Element {
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

        if (!(event.target instanceof HTMLFormElement)) {
            setIsValidating(false);
            return;
        }

        const password = event.target.password.value;

        if (!password) {
            setError("signIn.errors.missing.password");
            setIsValidating(false);
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
                    if (!isAxiosError(error)) {
                        console.error(error);
                        setError("errors.Unknown error");
                        return;
                    }

                    switch (error.status) {
                        case EHttpStatus.HTTP_400_BAD_REQUEST:
                            setError("signIn.errors.missing.password");
                            return;
                        case EHttpStatus.HTTP_403_FORBIDDEN:
                            setError("errors.Malformed request");
                            return;
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            setError("signIn.errors.invalid.password");
                            return;
                        default:
                            setError("errors.Internal server error");
                            return;
                    }
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
        searchParams.delete(EMAIL_TOKEN_NAME);
        navigate(`${ROUTES.SIGN_IN}?${searchParams.toString()}`);
    };

    return (
        <>
            <div className="xs:w-1/2">
                <h2 className="font-normal">{t("signIn.Welcome")}</h2>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={backToEmail}
                    disabled={isValidating}
                >
                    {email}
                </Button>
            </div>
            <Form.Root className="max-xs:mt-11 xs:w-1/2" onSubmit={submitPassword}>
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
                    {error && (
                        <Form.Message>
                            <div className="mt-1 flex items-center gap-1">
                                <IconComponent icon="circle-alert" className="text-red-500" size="4" />
                                <span className="text-sm text-red-500">{t(error)}</span>
                            </div>
                        </Form.Message>
                    )}
                </Form.Field>
                <Label className="mt-3 flex cursor-pointer select-none gap-2">
                    <Checkbox onClick={() => setShouldShowPassword((prev) => !prev)} disabled={isValidating} />
                    {t("signIn.Show password")}
                </Label>
                <div className="mt-8 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                    <Button type="button" variant="ghost" disabled={isValidating}>
                        {t("signIn.Forgot password?")}
                    </Button>
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? (
                            <IconComponent icon="loader-circle" size="5" strokeWidth={3} className="animate-spin" />
                        ) : (
                            t("common.Next")
                        )}
                    </Button>
                </div>
            </Form.Root>
        </>
    );
}

export default PasswordForm;

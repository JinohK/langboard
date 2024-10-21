import { Button, Form, Input, Toast } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { EMAIL_REGEX } from "@/constants";
import { ROUTES } from "@/core/routing/constants";
import useAuthEmail from "@/controllers/auth/useAuthEmail";
import { useState } from "react";
import { isAxiosError } from "axios";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { IconComponent } from "@/components/base";
import { EMAIL_TOKEN_QUERY_NAME, SIGN_IN_TOKEN_QUERY_NAME } from "@/pages/SignInPage/constants";
import { cn } from "@/core/utils/ComponentUtils";

export interface IEmailFormProps {
    signToken: string;
    setEmail: (email: string) => void;
    className: string;
}

function EmailForm({ signToken, setEmail, className }: IEmailFormProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useAuthEmail();
    const [error, setError] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        const emailInput = event.currentTarget.email;
        const email = emailInput.value;

        if (!email) {
            setError("signIn.errors.missing.email");
            setIsValidating(false);
            emailInput.focus();
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            setError("signIn.errors.invalid.email");
            setIsValidating(false);
            emailInput.focus();
            return;
        }

        mutate(
            { is_token: false, email: email, sign_token: signToken },
            {
                onSuccess: (data) => {
                    if (!data.token) {
                        setError("signIn.errors.Couldn't find your {app} Account");
                        return;
                    }

                    setEmail(email);

                    const searchParams = new URLSearchParams();
                    searchParams.append(SIGN_IN_TOKEN_QUERY_NAME, signToken);
                    searchParams.append(EMAIL_TOKEN_QUERY_NAME, data.token);

                    navigate(`${ROUTES.SIGN_IN.PASSWORD}?${searchParams.toString()}`);
                },
                onError: (error) => {
                    if (!isAxiosError(error)) {
                        console.error(error);
                        Toast.Add.error(t("errors.Unknown error"));
                        return;
                    }

                    switch (error.status) {
                        case EHttpStatus.HTTP_400_BAD_REQUEST:
                            setError("signIn.errors.missing.email");
                            emailInput.focus();
                            return;
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            setError("signIn.errors.Couldn't find your {app} Account");
                            emailInput.focus();
                            return;
                        default:
                            Toast.Add.error(t("errors.Internal server error"));
                            return;
                    }
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <>
            <div className={className}>
                <h2 className="text-4xl font-normal">{t("signIn.Sign in")}</h2>
                <div className="mt-4 text-base">{t("signIn.Use your {app} Account")}</div>
            </div>
            <Form.Root className={cn("max-xs:mt-11", className)} onSubmit={submitEmail}>
                <Form.Field name="email">
                    <Form.Control asChild>
                        <Input className="w-full" placeholder={t("signIn.Email")} autoFocus autoComplete="email" disabled={isValidating} />
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
                <div className="mt-16 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isValidating}
                        onClick={() => navigate(`${ROUTES.SIGN_UP.REQUIRED}?${new URLSearchParams(location.search).toString()}`)}
                    >
                        {t("signIn.Create account")}
                    </Button>
                    <Button type="submit" disabled={isValidating}>
                        {isValidating ? <IconComponent icon="loader-circle" size="5" strokeWidth={3} className="animate-spin" /> : t("common.Next")}
                    </Button>
                </div>
            </Form.Root>
        </>
    );
}

export default EmailForm;

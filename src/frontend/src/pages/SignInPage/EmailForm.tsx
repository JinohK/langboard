import { Button, Form, Input } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants";
import { makeTitleCase } from "@/core/utils/StringUtils";
import { ROUTES } from "@/core/routing/constants";
import useAuthEmail from "@/controllers/auth/useAuthEmail";
import { useState } from "react";
import { isAxiosError } from "axios";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { IconComponent } from "@/components/base";
import { EMAIL_REGEX, EMAIL_TOKEN_NAME, SIGN_IN_TOKEN_NAME } from "@/pages/SignInPage/constants";

export interface IEmailFormProps {
    signToken: string;
    setEmail: (email: string) => void;
}

function EmailForm({ signToken, setEmail }: IEmailFormProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useAuthEmail();
    const [error, setError] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        setIsValidating(true);

        if (!(event.target instanceof HTMLFormElement)) {
            setIsValidating(false);
            return;
        }

        const email = event.target.email.value;

        if (!email) {
            setError("signIn.errors.missing.email");
            setIsValidating(false);
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            setError("signIn.errors.invalid.email");
            setIsValidating(false);
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
                    searchParams.append(SIGN_IN_TOKEN_NAME, signToken);
                    searchParams.append(EMAIL_TOKEN_NAME, data.token);

                    navigate(`${ROUTES.SIGN_IN_PASSWORD}?${searchParams.toString()}`);
                },
                onError: (error) => {
                    if (!isAxiosError(error)) {
                        console.error(error);
                        setError("errors.Unknown error");
                        return;
                    }

                    switch (error.status) {
                        case EHttpStatus.HTTP_400_BAD_REQUEST:
                            setError("signIn.errors.missing.email");
                            return;
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            setError("signIn.errors.Couldn't find your {app} Account");
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

    return (
        <>
            <div className="xs:w-1/2">
                <h2 className="text-4xl font-normal">{t("signIn.Sign in")}</h2>
                <div className="mt-4 text-base">
                    {t("signIn.Use your {app} Account", { app: makeTitleCase(APP_NAME) })}
                </div>
            </div>
            <Form.Root className="max-xs:mt-11 xs:w-1/2" onSubmit={submitEmail}>
                <Form.Field name="email">
                    <Form.Control asChild>
                        <Input
                            className="w-full"
                            placeholder={t("signIn.Email")}
                            autoFocus
                            autoComplete="email"
                            disabled={isValidating}
                        />
                    </Form.Control>
                    {error && (
                        <Form.Message>
                            <div className="mt-1 flex items-center gap-1">
                                <IconComponent icon="circle-alert" className="text-red-500" size="4" />
                                <span className="text-sm text-red-500">
                                    {t(error, { app: makeTitleCase(APP_NAME) })}
                                </span>
                            </div>
                        </Form.Message>
                    )}
                </Form.Field>
                <Button type="button" variant="ghost" size="sm" className="mt-3" disabled={isValidating}>
                    {t("signIn.Forgot email?")}
                </Button>
                <div className="mt-8 flex items-center gap-8 max-xs:justify-between xs:justify-end">
                    <Button type="button" variant="ghost" disabled={isValidating}>
                        {t("signIn.Create account")}
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

export default EmailForm;

import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import * as Form from "@radix-ui/react-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants";
import { makeTitleCase } from "@/core/utils/StringUtils";
import { ROUTES } from "@/core/routing/constants";
import useAuthEmail from "@/controllers/auth/useAuthEmail";
import { useState } from "react";
import { isAxiosError } from "axios";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import IconComponent from "@/components/base/IconComponent";
import { EMAIL_REGEX, EMAIL_TOKEN_NAME, LOGIN_TOKEN_NAME } from "@/pages/LoginPage/constants";

export interface IEmailFormProps {
    loginToken: string;
    setEmail: (email: string) => void;
}

function EmailForm({ loginToken, setEmail }: IEmailFormProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useAuthEmail();
    const [error, setError] = useState("");

    const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!(event.target instanceof HTMLFormElement)) {
            return;
        }

        const email = event.target.email.value;

        if (!email) {
            setError("login.errors.missing.email");
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            setError("login.errors.invalid.email");
            return;
        }

        mutate(
            { is_token: false, email: email, login_token: loginToken },
            {
                onSuccess: (data) => {
                    if (!data.token) {
                        setError("login.errors.Couldn't find your {app} Account");
                        return;
                    }

                    setEmail(email);

                    const searchParams = new URLSearchParams();
                    searchParams.append(LOGIN_TOKEN_NAME, loginToken);
                    searchParams.append(EMAIL_TOKEN_NAME, data.token);

                    navigate(`${ROUTES.LOGIN_PASSWORD}?${searchParams.toString()}`);
                },
                onError: (error) => {
                    if (!isAxiosError(error)) {
                        console.error(error);
                        setError("errors.Unknown error");
                        return;
                    }

                    switch (error.status) {
                        case EHttpStatus.HTTP_400_BAD_REQUEST:
                            setError("login.errors.missing.email");
                            return;
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            setError("login.errors.Couldn't find your {app} Account");
                            return;
                        default:
                            setError("errors.Internal server error");
                            return;
                    }
                },
            }
        );
    };

    return (
        <>
            <div className="xs:w-1/2">
                <Heading size="8" weight="regular">
                    {t("login.Sign in")}
                </Heading>
                <Text as="div" size="3" mt="4">
                    {t("login.Use your {app} Account", { app: makeTitleCase(APP_NAME) })}
                </Text>
            </div>
            <Form.Root className="max-xs:mt-11 xs:w-1/2" onSubmit={submitEmail}>
                <Form.Field name="email">
                    <Form.Control asChild>
                        <TextField.Root size="3" className="w-full" placeholder={t("login.Email")} autoFocus />
                    </Form.Control>
                    {error && (
                        <Form.Message>
                            <Flex align="center" gap="1">
                                <IconComponent name="circle-alert" iconColor="red" />
                                <Text color="red" size="2">
                                    {t(error, { app: makeTitleCase(APP_NAME) })}
                                </Text>
                            </Flex>
                        </Form.Message>
                    )}
                </Form.Field>
                <Button type="button" variant="ghost" mt="3" ml="1" size="2">
                    {t("login.Forgot email?")}
                </Button>
                <Flex align="center" className="gap-8 max-xs:justify-between xs:justify-end" mt="8">
                    <Button type="button" variant="ghost">
                        {t("login.Create account")}
                    </Button>
                    <Button type="submit">{t("common.Next")}</Button>
                </Flex>
            </Form.Root>
        </>
    );
}

export default EmailForm;

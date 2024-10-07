import { Button, Checkbox, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import * as Form from "@radix-ui/react-form";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import useLogin from "@/controllers/auth/useLogin";
import { isAxiosError } from "axios";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import IconComponent from "@/components/base/IconComponent";
import { useAuth } from "@/core/providers/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { REDIRECT_QUERY_NAME } from "@/controllers/constants";

export interface IPasswordformProps {
    loginToken: string;
    emailToken: string;
    email: string;
    setEmail: (email: string) => void;
}

function PasswordForm({ loginToken, emailToken, email, setEmail }: IPasswordformProps): JSX.Element {
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [shouldShowPassword, setShouldShowPassword] = useState(false);
    const [error, setError] = useState("");
    const { mutate } = useLogin();
    const { login } = useAuth();

    const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!(event.target instanceof HTMLFormElement)) {
            return;
        }

        const password = event.target.password.value;

        if (!password) {
            setError("login.errors.missing.password");
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const redirectUrl = searchParams.get(REDIRECT_QUERY_NAME) ?? ROUTES.AFTER_LOGIN;

        mutate(
            { login_token: loginToken, email_token: emailToken, password },
            {
                onSuccess: (data) => {
                    if (!data.access_token || !data.refresh_token) {
                        setError("login.errors.Couldn't find your {app} Account");
                        return;
                    }

                    login(data.access_token, data.refresh_token);
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
                            setError("login.errors.missing.password");
                            return;
                        case EHttpStatus.HTTP_403_FORBIDDEN:
                            setError("errors.Malformed request");
                            return;
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            setError("login.errors.invalid.password");
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
                    {t("login.Welcome")}
                </Heading>
                <Button variant="outline" size="2" className="mt-4" onClick={() => setEmail("")}>
                    {email}
                </Button>
            </div>
            <Form.Root className="max-xs:mt-11 xs:w-1/2" onSubmit={submitPassword}>
                <Form.Field name="password">
                    <Form.Control asChild>
                        <TextField.Root
                            type={shouldShowPassword ? "text" : "password"}
                            size="3"
                            className="w-full"
                            placeholder={t("login.Password")}
                            autoFocus
                        />
                    </Form.Control>
                    {error && (
                        <Form.Message>
                            <Flex align="center" gap="1">
                                <IconComponent name="circle-alert" iconColor="red" />
                                <Text color="red" size="2">
                                    {t(error)}
                                </Text>
                            </Flex>
                        </Form.Message>
                    )}
                </Form.Field>
                <Text as="label" size="2" className="cursor-pointer select-none">
                    <Flex gap="2" mt="3">
                        <Checkbox onClick={() => setShouldShowPassword((prev) => !prev)} />
                        {t("login.Show password")}
                    </Flex>
                </Text>
                <Flex align="center" className="gap-8 max-xs:justify-between xs:justify-end" mt="8">
                    <Button type="button" variant="ghost">
                        {t("login.Forgot password?")}
                    </Button>
                    <Button type="submit">{t("common.Next")}</Button>
                </Flex>
            </Form.Root>
        </>
    );
}

export default PasswordForm;

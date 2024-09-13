import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import * as Form from "@radix-ui/react-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants";
import { makeTitleCase } from "@/core/utils/StringUtils";
import { ROUTES } from "@/core/routing/constants";
import useCheckEmail from "@/controllers/auth/checkEmail";
import { useState } from "react";

export interface IEmailFormProps {
    loginToken: string;
    setEmail: (email: string) => void;
    setEmailToken: (token: string) => void;
}

function EmailForm({ loginToken, setEmail, setEmailToken }: IEmailFormProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useCheckEmail();
    const [error, setError] = useState("");

    const handleEmail = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        const email = event.target.closest<HTMLFormElement>("form")?.email.value;

        if (!email) {
            setError("login.Email is required");
            return;
        }

        mutate(
            { is_token: false, email: email, login_token: loginToken },
            {
                onSuccess: (data) => {
                    if (!data.status) {
                        setError("login.Email not found");
                        return;
                    }

                    setEmail(email);
                    setEmailToken(data.token);

                    navigate(`${ROUTES.LOGIN_PASSWORD}`);
                },
                onError: (error) => {
                    console.error(error);
                    setError("login.Email not found");
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
            <Form.Root className="max-xs:mt-11 xs:w-1/2">
                <Form.Field name="email">
                    <Form.Control asChild>
                        <TextField.Root size="3" className="w-full" placeholder={t("login.Email")} />
                    </Form.Control>
                </Form.Field>
                <Button type="button" variant="ghost" mt="3" ml="1" size="2">
                    {t("login.Forgot email?")}
                </Button>
                <Flex align="center" className="gap-8 max-xs:justify-between xs:justify-end" mt="8">
                    <Button type="button" variant="ghost">
                        {t("login.Create account")}
                    </Button>
                    <Button type="button" onClick={handleEmail}>
                        {t("common.Next")}
                    </Button>
                </Flex>
            </Form.Root>
        </>
    );
}

export default EmailForm;

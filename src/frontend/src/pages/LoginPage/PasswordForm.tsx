import { Button, Checkbox, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import * as Form from "@radix-ui/react-form";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export interface IPasswordformProps {
    email: string;
    setEmail: (email: string) => void;
}

function PasswordForm({ email, setEmail }: IPasswordformProps): JSX.Element {
    const [t] = useTranslation();
    const [shouldShowPassword, setShouldShowPassword] = useState(false);

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
            <Form.Root className="max-xs:mt-11 xs:w-1/2">
                <Form.Field name="password">
                    <Form.Control asChild>
                        <TextField.Root
                            type={shouldShowPassword ? "text" : "password"}
                            size="3"
                            className="w-full"
                            placeholder={t("login.Password")}
                        />
                    </Form.Control>
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
                    <Button type="button">{t("common.Next")}</Button>
                </Flex>
            </Form.Root>
        </>
    );
}

export default PasswordForm;

import { Box, Container, Flex } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import EmailForm from "@/pages/LoginPage/EmailForm";
import PasswordForm from "@/pages/LoginPage/PasswordForm";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { generateToken } from "@/core/utils/StringUtils";
import useAuthEmail from "@/controllers/auth/useAuthEmail";

function LoginPage(): JSX.Element {
    const LOGIN_TOKEN_NAME = "itkl";
    const EMAIL_TOKEN_NAME = "TKE";

    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [form, setForm] = useState<JSX.Element>();
    const { mutate } = useAuthEmail();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const loginTokenParam = searchParams.get(LOGIN_TOKEN_NAME);
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_NAME);

        if (!loginTokenParam || loginTokenParam.length !== 64) {
            const token = generateToken(64);

            searchParams.set(LOGIN_TOKEN_NAME, token);

            navigate(`${ROUTES.LOGIN}?${searchParams.toString()}`, {
                replace: true,
            });

            return;
        }

        if (loginTokenParam && emailTokenParam) {
            mutate(
                { is_token: true, token: emailTokenParam, login_token: loginTokenParam },
                {
                    onSuccess: (data) => {
                        if (!data.token) {
                            throw new Error();
                        }

                        if (email !== data.email) {
                            setEmail(data.email);
                        }
                    },
                    onError: () => {
                        searchParams.delete(EMAIL_TOKEN_NAME);
                        navigate(`${ROUTES.LOGIN}?${searchParams.toString()}`);
                    },
                }
            );
        }
    }, [navigate, location]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const loginTokenParam = searchParams.get(LOGIN_TOKEN_NAME) ?? "";
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_NAME);

        if (loginTokenParam && emailTokenParam) {
            setForm(
                <PasswordForm
                    loginToken={loginTokenParam}
                    emailToken={emailTokenParam}
                    email={email}
                    setEmail={setEmail}
                />
            );
        } else {
            setForm(<EmailForm loginToken={loginTokenParam} setEmail={setEmail} />);
        }
    }, [location, email]);

    return (
        <Container
            className="flex h-screen flex-col items-center justify-center"
            size="3"
            height={{ initial: "100vh", xs: "auto" }}
        >
            <Flex className="flex-col max-xs:h-full max-xs:justify-between">
                <Box className="max-sm:p-6 xs:rounded-2xl xs:bg-gray-50 xs:dark:bg-gray-800 sm:p-9">
                    <Box mb="6">
                        <img src="/images/logo.png" alt="Logo" className="h-9 w-9" />
                    </Box>
                    <Flex className="max-xs:flex-col xs:flex-wrap xs:justify-between">{form}</Flex>
                </Box>
                <Box className="max-sm:p-4 sm:mt-2">
                    <LanguageSwitcher variant="ghost" triggerType="text" />
                    <ThemeSwitcher variant="ghost" triggerType="text" />
                </Box>
            </Flex>
        </Container>
    );
}

export default LoginPage;

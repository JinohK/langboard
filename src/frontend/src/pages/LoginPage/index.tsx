import { Box, Container, Flex } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import EmailForm from "@/pages/LoginPage/EmailForm";
import PasswordForm from "@/pages/LoginPage/PasswordForm";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { generateToken } from "@/core/utils/StringUtils";
import useCheckEmail from "@/controllers/auth/checkEmail";

function LoginPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState("");
    const [loginToken, setLoginToken] = useState(searchParams.get("itkl") || "");
    const [emailToken, setEmailToken] = useState(searchParams.get("TKE") || "");
    const redirectUrl = searchParams.get("continue");
    const { mutate } = useCheckEmail();

    useEffect(() => {
        if (!loginToken || loginToken.length !== 64) {
            const token = generateToken(64);
            setLoginToken(token);

            const params = new URLSearchParams();
            params.append("itkl", token);
            if (redirectUrl) {
                params.append("continue", redirectUrl);
            }

            navigate(`${ROUTES.LOGIN}?${params.toString()}`);
        }
    }, [location, loginToken]);

    if (loginToken && emailToken) {
        mutate(
            { login_token: loginToken, is_token: true, token: emailToken },
            {
                onSuccess: () => {
                    const params = new URLSearchParams();
                    params.append("itkl", loginToken);
                    params.append("TKE", emailToken);
                    if (redirectUrl) {
                        params.append("continue", redirectUrl);
                    }
                    navigate(`${ROUTES.LOGIN}?${params.toString()}`);
                },
            }
        );
    }

    const targetForm =
        !emailToken || !email ? (
            <EmailForm loginToken={loginToken} setEmail={setEmail} setEmailToken={setEmailToken} />
        ) : (
            <PasswordForm email={email} setEmail={setEmail} />
        );

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
                    <Flex className="max-xs:flex-col xs:flex-wrap xs:justify-between">{targetForm}</Flex>
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

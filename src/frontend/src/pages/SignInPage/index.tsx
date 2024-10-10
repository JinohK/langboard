import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import EmailForm from "@/pages/SignInPage/EmailForm";
import PasswordForm from "@/pages/SignInPage/PasswordForm";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { generateToken } from "@/core/utils/StringUtils";
import useAuthEmail from "@/controllers/auth/useAuthEmail";

function SignInPage(): JSX.Element {
    const SIGN_IN_TOKEN_NAME = "itkl";
    const EMAIL_TOKEN_NAME = "TKE";

    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [form, setForm] = useState<JSX.Element>();
    const { mutate } = useAuthEmail();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(SIGN_IN_TOKEN_NAME);
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_NAME);

        if (!signTokenParam || signTokenParam.length !== 64) {
            const token = generateToken(64);

            searchParams.set(SIGN_IN_TOKEN_NAME, token);

            navigate(`${ROUTES.SIGN_IN}?${searchParams.toString()}`, {
                replace: true,
            });

            return;
        }

        if (signTokenParam && emailTokenParam) {
            mutate(
                { is_token: true, token: emailTokenParam, sign_token: signTokenParam },
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
                        navigate(`${ROUTES.SIGN_IN}?${searchParams.toString()}`);
                    },
                }
            );
        }
    }, [navigate, location]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(SIGN_IN_TOKEN_NAME) ?? "";
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_NAME);

        if (signTokenParam && emailTokenParam) {
            setForm(
                <PasswordForm
                    signToken={signTokenParam}
                    emailToken={emailTokenParam}
                    email={email}
                    setEmail={setEmail}
                />
            );
        } else {
            setEmail("");
            setForm(<EmailForm signToken={signTokenParam} setEmail={setEmail} />);
        }
    }, [location, email]);

    return (
        <div className="flex h-screen min-h-screen flex-col items-center justify-center xs:h-auto">
            <div className="w-full max-w-screen-sm">
                <div className="flex flex-col max-xs:h-full max-xs:justify-between">
                    <div className="max-sm:p-6 xs:rounded-2xl xs:border-2 xs:border-border sm:p-9">
                        <div className="mb-6">
                            <img src="/images/logo.png" alt="Logo" className="h-9 w-9" />
                        </div>
                        <div className="flex max-xs:flex-col xs:flex-wrap xs:justify-between">{form}</div>
                    </div>
                    <div className="max-sm:p-4 sm:mt-2">
                        <LanguageSwitcher variant="ghost" triggerType="text" />
                        <ThemeSwitcher variant="ghost" triggerType="text" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignInPage;

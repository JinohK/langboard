import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormOnlyLayout, createTwoSidedSizeClassNames } from "@/components/Layout";
import useAuthEmail from "@/controllers/api/auth/useAuthEmail";
import { ROUTES } from "@/core/routing/constants";
import { generateToken } from "@/core/utils/StringUtils";
import EmailForm from "@/pages/auth/SignInPage/EmailForm";
import PasswordForm from "@/pages/auth/SignInPage/PasswordForm";
import { EMAIL_TOKEN_QUERY_NAME, SIGN_IN_TOKEN_LENGTH, SIGN_IN_TOKEN_QUERY_NAME } from "@/pages/auth/SignInPage/constants";
import { Flex } from "@/components/base";

function SignInPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [form, setForm] = useState<JSX.Element>();
    const { mutate } = useAuthEmail();

    const { wrapper: wrapperClassName, width: widthClassName } = createTwoSidedSizeClassNames("sm");

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(SIGN_IN_TOKEN_QUERY_NAME);
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_QUERY_NAME);

        if (!signTokenParam || signTokenParam.length !== SIGN_IN_TOKEN_LENGTH) {
            const token = generateToken(SIGN_IN_TOKEN_LENGTH);

            searchParams.set(SIGN_IN_TOKEN_QUERY_NAME, token);

            navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`, {
                replace: true,
            });

            return;
        }

        if (signTokenParam && emailTokenParam) {
            if (location.pathname !== ROUTES.SIGN_IN.PASSWORD) {
                navigate(`${ROUTES.SIGN_IN.PASSWORD}?${searchParams.toString()}`, { replace: true });
                return;
            }

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
                        searchParams.delete(EMAIL_TOKEN_QUERY_NAME);
                        navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`);
                    },
                }
            );
        }
    }, [location]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(SIGN_IN_TOKEN_QUERY_NAME) ?? "";
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_QUERY_NAME);

        if (signTokenParam && emailTokenParam) {
            setForm(
                <PasswordForm signToken={signTokenParam} emailToken={emailTokenParam} email={email} setEmail={setEmail} className={widthClassName} />
            );
        } else {
            setEmail("");
            setForm(<EmailForm signToken={signTokenParam} setEmail={setEmail} className={widthClassName} />);
        }
    }, [location, email]);

    return (
        <FormOnlyLayout size="default" useLogo>
            <Flex className={wrapperClassName}>{form}</Flex>
        </FormOnlyLayout>
    );
}

export default SignInPage;

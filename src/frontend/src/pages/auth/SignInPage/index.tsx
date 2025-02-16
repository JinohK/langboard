import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { QUERY_NAMES, SIGN_IN_TOKEN_LENGTH } from "@/constants";
import { FormOnlyLayout, createTwoSidedSizeClassNames } from "@/components/Layout";
import useAuthEmail from "@/controllers/api/auth/useAuthEmail";
import { ROUTES } from "@/core/routing/constants";
import { generateToken } from "@/core/utils/StringUtils";
import EmailForm from "@/pages/auth/SignInPage/EmailForm";
import PasswordForm from "@/pages/auth/SignInPage/PasswordForm";
import { Flex } from "@/components/base";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";

function SignInPage(): JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const navigateRef = useRef(usePageNavigate());
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [form, setForm] = useState<JSX.Element>();
    const { mutate } = useAuthEmail();

    const { wrapper: wrapperClassName, width: widthClassName } = createTwoSidedSizeClassNames("sm");

    useEffect(() => {
        setPageAliasRef.current("Sign In");
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(QUERY_NAMES.SIGN_IN_TOKEN);
        const emailTokenParam = searchParams.get(QUERY_NAMES.EMAIL_TOKEN);

        if (!signTokenParam || signTokenParam.length !== SIGN_IN_TOKEN_LENGTH) {
            const token = generateToken(SIGN_IN_TOKEN_LENGTH);

            searchParams.set(QUERY_NAMES.SIGN_IN_TOKEN, token);

            navigateRef.current(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`, {
                replace: true,
            });

            return;
        }

        if (signTokenParam && emailTokenParam) {
            if (location.pathname !== ROUTES.SIGN_IN.PASSWORD) {
                navigateRef.current(`${ROUTES.SIGN_IN.PASSWORD}?${searchParams.toString()}`, { replace: true });
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
                        searchParams.delete(QUERY_NAMES.EMAIL_TOKEN);
                        navigateRef.current(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`);
                    },
                }
            );
        }
    }, [location]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(QUERY_NAMES.SIGN_IN_TOKEN) ?? "";
        const emailTokenParam = searchParams.get(QUERY_NAMES.EMAIL_TOKEN);

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

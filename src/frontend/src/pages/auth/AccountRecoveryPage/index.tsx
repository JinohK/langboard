import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { FormOnlyLayout } from "@/components/Layout";
import { Button } from "@/components/base";
import useAuthEmail from "@/controllers/api/auth/useAuthEmail";
import { RECOVERY_TOKEN_QUERY_NAME } from "@/controllers/api/auth/useSendResetLink";
import useValidateRecoveryToken from "@/controllers/api/auth/useValidateRecoveryToken";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import ResetPasswordForm from "@/pages/auth/AccountRecoveryPage/ResetPasswordForm";
import SendResetLinkForm from "@/pages/auth/AccountRecoveryPage/SendResetLinkForm";
import { EMAIL_TOKEN_QUERY_NAME, SIGN_IN_TOKEN_LENGTH, SIGN_IN_TOKEN_QUERY_NAME } from "@/pages/auth/SignInPage/constants";
import usePageNavigate from "@/core/hooks/usePageNavigate";

function AccountRecoveryPage(): JSX.Element {
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = usePageNavigate();
    const [email, setEmail] = useState<string | null>(location.state?.email);
    const [[form, description], setPage] = useState<[JSX.Element | null, string]>([null, ""]);
    const { mutate: validateRecoveryTokenMutate } = useValidateRecoveryToken();
    const { mutate: checkEmailMutate } = useAuthEmail();

    const backToSignin = () => {
        const searchParams = new URLSearchParams(location.search);
        navigate(`${ROUTES.SIGN_IN.PASSWORD}?${searchParams.toString()}`);
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(SIGN_IN_TOKEN_QUERY_NAME);
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_QUERY_NAME);
        const recoveryTokenParam = searchParams.get(RECOVERY_TOKEN_QUERY_NAME);

        if (location.pathname === ROUTES.ACCOUNT_RECOVERY.RESET) {
            if (!recoveryTokenParam) {
                searchParams.delete(RECOVERY_TOKEN_QUERY_NAME);
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
                return;
            }

            if (!email) {
                validateRecoveryTokenMutate(
                    { recovery_token: recoveryTokenParam },
                    {
                        onSuccess: (data) => {
                            if (email !== data.email) {
                                setEmail(data.email);
                            }
                        },
                        onError: () => {
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
                        },
                    }
                );
            }

            return;
        }

        if (!signTokenParam || signTokenParam.length !== SIGN_IN_TOKEN_LENGTH || !emailTokenParam) {
            searchParams.delete(SIGN_IN_TOKEN_QUERY_NAME);
            searchParams.delete(EMAIL_TOKEN_QUERY_NAME);
            navigate(`${ROUTES.SIGN_IN.EMAIL}?${searchParams.toString()}`, { replace: true });
            return;
        }

        if (!email) {
            checkEmailMutate(
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
                        backToSignin();
                    },
                }
            );
        }
    }, [location]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const signTokenParam = searchParams.get(SIGN_IN_TOKEN_QUERY_NAME);
        const emailTokenParam = searchParams.get(EMAIL_TOKEN_QUERY_NAME);
        const recoveryTokenParam = searchParams.get(RECOVERY_TOKEN_QUERY_NAME);

        switch (location.pathname) {
            case ROUTES.ACCOUNT_RECOVERY.NAME:
                if (!signTokenParam || !emailTokenParam) {
                    return;
                }

                setPage([
                    <SendResetLinkForm signToken={signTokenParam} emailToken={emailTokenParam} backToSignin={backToSignin} />,
                    t("accountRecovery.Please enter your name to verify your account."),
                ]);
                break;
            case ROUTES.ACCOUNT_RECOVERY.RESET:
                if (!recoveryTokenParam) {
                    return;
                }

                setPage([
                    <ResetPasswordForm recoveryToken={recoveryTokenParam} backToSignin={backToSignin} />,
                    t("accountRecovery.Please enter your new password."),
                ]);
                break;
        }
    }, [location, email]);

    if (location.state?.isTwoSidedView ?? true) {
        const leftSide = (
            <>
                <h2 className="text-4xl font-normal">{t("accountRecovery.Password recovery")}</h2>
                <div className="mt-4 text-base">{description}</div>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={backToSignin} title={`Sign in with ${email}`}>
                    {email}
                </Button>
            </>
        );

        return <FormOnlyLayout leftSide={leftSide} rightSide={form} useLogo size="sm" />;
    } else {
        return (
            <FormOnlyLayout size="sm" useLogo>
                {form}
            </FormOnlyLayout>
        );
    }
}

export default AccountRecoveryPage;

import { Button, Toast } from "@/components/base";
import { FormOnlyLayout } from "@/components/Layout";
import useResendSignUpLink from "@/controllers/signup/useResendSignUpLink";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

function CompletePage(): JSX.Element {
    const [t, i18n] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate } = useResendSignUpLink();
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (!location.state?.email) {
            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }
    }, []);

    const resend = () => {
        if (!location.state?.email) {
            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }

        setIsResending(true);

        mutate(
            { email: location.state.email, lang: i18n.language },
            {
                onSuccess: () => {
                    Toast.Add.success(t("signUp.complete.Email has been resent."));
                },
                onError: (error) => {
                    if (!isAxiosError(error)) {
                        console.error(error);
                        Toast.Add.error(t("errors.Unknown error"));
                        return;
                    }

                    switch (error.response?.status) {
                        case EHttpStatus.HTTP_404_NOT_FOUND:
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
                            return;
                        case EHttpStatus.HTTP_409_CONFLICT:
                            Toast.Add.error(t("signUp.errors.Account already activated. Please sign in."));
                            navigate(ROUTES.SIGN_IN.EMAIL);
                            return;
                        case EHttpStatus.HTTP_503_SERVICE_UNAVAILABLE:
                            Toast.Add.error(t("errors.Email service is temporarily unavailable. Please try again later."));
                            return;
                        default:
                            Toast.Add.error(t("errors.Internal server error"));
                            return;
                    }
                },
                onSettled: () => {
                    setIsResending(false);
                },
            }
        );
    };

    return (
        <FormOnlyLayout size="sm" useLogo>
            <h2 className="text-center text-2xl font-normal xs:text-3xl">{t("signUp.complete.One More Step to Sign Up")}</h2>
            <p className="mt-8 text-sm xs:text-base">
                {t("signUp.complete.We have sent you an email to verify your email address.")}&nbsp;
                {t("signUp.complete.Please check your inbox and click on the link to complete your sign up.")}
            </p>
            <p className="mt-4 text-sm xs:text-base">
                {t("signUp.complete.If you don't see the email, check junk, spam, social, or other folders.")}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
                <span className="text-sm xs:text-base">{t("signUp.complete.Haven't received the email?")}</span>
                <Button type="button" variant="outline" onClick={resend} disabled={isResending}>
                    {t("signUp.complete.Resend")}
                </Button>
            </div>
        </FormOnlyLayout>
    );
}

export default CompletePage;

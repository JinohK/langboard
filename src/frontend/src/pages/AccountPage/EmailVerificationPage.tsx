import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Toast } from "@/components/base";
import { SUB_EMAIL_VERIFY_TOKEN_QUERY_NAME } from "@/controllers/api/account/useAddNewEmail";
import useVerifyNewEmail from "@/controllers/api/account/useVerifyNewEmail";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import usePageNavigate from "@/core/hooks/usePageNavigate";

function EmailVerificationPage() {
    const [t] = useTranslation();
    const { updatedUser } = useAuth();
    const location = useLocation();
    const navigate = usePageNavigate();
    const { mutate } = useVerifyNewEmail();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get(SUB_EMAIL_VERIFY_TOKEN_QUERY_NAME);

        if (!token) {
            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }

        mutate(
            { verify_token: token },
            {
                onSuccess: () => {
                    updatedUser();
                    Toast.Add.success(t("myAccount.successes.The email verified successfully."));
                    navigate(ROUTES.ACCOUNT.EMAILS.ROUTE);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_304_NOT_MODIFIED]: () => {
                            Toast.Add.error(t("myAccount.errors.The email is already verified."));
                            navigate(ROUTES.ACCOUNT.EMAILS.ROUTE);
                        },
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("errors.Malformed request"));
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
                        },
                        [EHttpStatus.HTTP_409_CONFLICT]: () => {
                            Toast.Add.error(t("myAccount.errors.The email is probably deleted."));
                            navigate(ROUTES.ACCOUNT.EMAILS.ROUTE);
                        },
                    });

                    handle(error);
                },
            }
        );
    }, []);

    return <></>;
}

export default EmailVerificationPage;

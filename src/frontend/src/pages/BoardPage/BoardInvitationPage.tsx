import { Toast } from "@/components/base";
import useAcceptProjectInvitation from "@/controllers/api/board/useAcceptProjectInvitation";
import { PROJCT_INVITATION_TOKEN_QUERY_NAME } from "@/controllers/api/board/useUpdateProjectAssignedUsers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { ROUTES } from "@/core/routing/constants";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

function BoardInvitationPage() {
    const [t] = useTranslation();
    const location = useLocation();
    const navigate = usePageNavigate();
    const [isValidating, setIsValidating] = useState(false);
    const { mutate } = useAcceptProjectInvitation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get(PROJCT_INVITATION_TOKEN_QUERY_NAME);

        if (!token) {
            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }
    }, []);

    const accept = () => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get(PROJCT_INVITATION_TOKEN_QUERY_NAME);

        if (!token) {
            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
            return;
        }

        setIsValidating(true);

        mutate(
            { token },
            {
                onSuccess: () => {
                    navigate(ROUTES.ACCOUNT.EMAILS.ROUTE);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_406_NOT_ACCEPTABLE]: () => {
                            Toast.Add.error(t("errors.Malformed request"));
                            navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND));
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return <></>;
}

export default BoardInvitationPage;

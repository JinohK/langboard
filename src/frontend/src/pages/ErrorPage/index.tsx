import { Button, Flex, Separator } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import TypeUtils from "@/core/utils/TypeUtils";
import getErrorMessage from "@/pages/ErrorPage/getErrorMessage";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function ErrorPage(): JSX.Element {
    const { setIsLoadingRef, setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { isAuthenticated } = useAuth();
    const code = window.location.pathname.split("/").pop();
    let errorCode = EHttpStatus[code as keyof typeof EHttpStatus];
    if (!errorCode) {
        errorCode = EHttpStatus.HTTP_404_NOT_FOUND;
    }

    if (!TypeUtils.isNumber(errorCode)) {
        errorCode = EHttpStatus[errorCode as keyof typeof EHttpStatus];
    }

    const message = getErrorMessage(errorCode);

    useEffect(() => {
        setIsLoadingRef.current(false);
        setPageAliasRef.current(message);
    }, []);

    const handleBack = () => {
        if (isAuthenticated()) {
            location.href = ROUTES.DASHBOARD.PROJECTS.ALL;
        } else {
            location.href = ROUTES.SIGN_IN.EMAIL;
        }
    };

    return (
        <Flex direction="col" items="center" justify="center" maxH="screen" minH="screen" gap="3">
            <h1 className="max-xs:text-2xl flex items-center gap-3 text-4xl font-bold text-gray-600">
                {errorCode.toString()}
                <Separator className="mt-1 h-8 w-0.5" orientation="vertical" />
                {message.toUpperCase()}
            </h1>
            <Button onClick={handleBack}>{t(isAuthenticated() ? "common.Go to Dashboard" : "common.Go to Sign In")}</Button>
        </Flex>
    );
}

export default ErrorPage;

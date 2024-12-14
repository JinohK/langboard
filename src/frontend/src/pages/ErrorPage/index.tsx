import { Flex, Separator } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import getErrorMessage from "@/pages/ErrorPage/getErrorMessage";
import { useEffect } from "react";

function ErrorPage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();
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
    }, []);

    return (
        <Flex direction="col" items="center" justify="center" className="max-h-screen min-h-screen">
            <h1 className="max-xs:text-2xl flex items-center gap-3 text-4xl font-bold text-gray-600">
                {errorCode.toString()}
                <Separator className="mt-1 h-8 w-0.5" orientation="vertical" />
                {message}
            </h1>
        </Flex>
    );
}

export default ErrorPage;

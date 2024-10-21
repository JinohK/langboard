import { Separator } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import getErrorMessage from "@/pages/ErrorPage/getErrorMessage";

function ErrorPage(): JSX.Element {
    const code = window.location.pathname.split("/").pop();
    let errorCode = EHttpStatus[code as keyof typeof EHttpStatus];
    if (!errorCode) {
        errorCode = EHttpStatus.HTTP_404_NOT_FOUND;
    }

    if (typeof errorCode !== "number") {
        errorCode = EHttpStatus[errorCode as keyof typeof EHttpStatus];
    }

    const message = getErrorMessage(errorCode);

    return (
        <div className="flex max-h-screen min-h-screen flex-col items-center justify-center">
            <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-600 max-xs:text-2xl">
                {errorCode.toString()}
                <Separator className="mt-1 h-8 w-0.5" orientation="vertical" />
                {message}
            </h1>
        </div>
    );
}

export default ErrorPage;

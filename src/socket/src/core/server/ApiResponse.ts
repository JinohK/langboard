import EApiErrorCode from "@/core/server/ApiErrorCode";
import EHttpStatus from "@/core/server/EHttpStatus";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const JsonResponse = (content: any, statusCode: EHttpStatus = EHttpStatus.HTTP_200_OK) => {
    return {
        type: "json",
        statusCode: statusCode,
        body: JSON.stringify(content),
    };
};

export const ApiErrorResponse = (errorCode: EApiErrorCode, statusCode: EHttpStatus) => {
    let code;
    let message;
    if (errorCode.includes(" ")) {
        code = EApiErrorCode[errorCode as unknown as keyof typeof EApiErrorCode];
        message = errorCode;
    } else {
        code = errorCode;
        message = EApiErrorCode[errorCode as unknown as keyof typeof EApiErrorCode];
    }

    return {
        type: "json",
        statusCode: statusCode,
        body: JSON.stringify({
            code,
            message,
        }),
    };
};

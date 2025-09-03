import { EApiErrorCode, EHttpStatus } from "@langboard/core/enums";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JsonResponse = (content: any, statusCode: EHttpStatus = EHttpStatus.HTTP_200_OK) => {
    return {
        type: "json",
        statusCode: statusCode,
        body: JSON.stringify(content),
    } as const;
};

export const ApiErrorResponse = (errorCode: EApiErrorCode, statusCode: EHttpStatus) => {
    let code;
    let message;
    const errorCodes = Object.keys(EApiErrorCode);
    const errorValues = Object.values(EApiErrorCode);
    if (errorValues.includes(errorCode)) {
        code = errorCodes[errorValues.indexOf(errorCode)];
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
    } as const;
};

import { Toast } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { AxiosError, isAxiosError } from "axios";
import { t } from "i18next";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IApiErrorHandlerMap extends Partial<Record<EHttpStatus, (error: AxiosError<any, any>) => unknown | Promise<unknown>>> {
    nonApiError?: (error: unknown) => unknown | Promise<unknown>;
    wildcardError?: (error: unknown) => unknown | Promise<unknown>;
}

const setupApiErrorHandler = (map: IApiErrorHandlerMap) => {
    const getHandler = <T>(error: T) => {
        if (!isAxiosError(error)) {
            if (map.nonApiError) {
                return () => map.nonApiError!(error);
            } else {
                return () => {
                    console.error(error);
                    Toast.Add.error(t("errors.Unknown error"));
                };
            }
        }

        const status = error.response?.status;
        const handler = map[status as EHttpStatus];
        if (!handler) {
            if (map.wildcardError) {
                return () => map.wildcardError!(error);
            } else {
                return () => {
                    Toast.Add.error(t("errors.Internal server error"));
                };
            }
        }

        return () => handler(error);
    };

    const handle = <T>(error: T) => {
        const handler = getHandler(error);
        return handler();
    };

    const handleAsync = async <T>(error: T) => {
        const handler = getHandler(error);
        return await handler();
    };

    return { handle, handleAsync };
};

export default setupApiErrorHandler;

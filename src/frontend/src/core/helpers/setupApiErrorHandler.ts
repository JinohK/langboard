import { Toast } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { AxiosError, isAxiosError } from "axios";
import { t } from "i18next";

export type TResponseErrors = Record<string, Record<string, string[] | undefined> | undefined> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TAxiosErrorCallback = (error: AxiosError<any, any>, responseErrors: TResponseErrors) => unknown | Promise<unknown>;

export interface IApiErrorHandlerMap extends Partial<Record<EHttpStatus, TAxiosErrorCallback>> {
    nonApiError?: (error: unknown) => unknown | Promise<unknown>;
    wildcardError?: TAxiosErrorCallback;
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
                return () => map.wildcardError!(error, error.response?.data.errors);
            } else {
                return () => {
                    let messageKey: string;
                    if (error.code === AxiosError.ERR_NETWORK) {
                        messageKey = "errors.Network error";
                    } else {
                        messageKey = "errors.Internal server error";
                    }

                    Toast.Add.error(t(messageKey));
                };
            }
        }

        return () => handler(error, error.response?.data.errors);
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

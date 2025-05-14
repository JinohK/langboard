import { AxiosError, isAxiosError } from "axios";
import { t } from "i18next";
import { Toast } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import TypeUtils from "@/core/utils/TypeUtils";

export type TResponseErrors = Record<string, Record<string, string[] | undefined> | undefined> | undefined;

type TCallbackReturnUnknown = unknown | Promise<unknown>;
type TCallbackReturnString = string | Promise<string>;

type TAxiosErrorCallback = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: AxiosError<any, any>,
    responseErrors: TResponseErrors
) => TCallbackReturnUnknown | TCallbackReturnString | void | Promise<void>;

export interface IApiErrorHandlerMap extends Partial<Record<EHttpStatus, TAxiosErrorCallback>> {
    nonApiError?: (error: unknown) => TCallbackReturnUnknown | TCallbackReturnString | void | Promise<void>;
    networkError?: (error: AxiosError) => TCallbackReturnUnknown | TCallbackReturnString | void | Promise<void>;
    wildcardError?: TAxiosErrorCallback;
}

const setupApiErrorHandler = (map: IApiErrorHandlerMap, messageRef?: { message: string }) => {
    const handleResult = (result: TCallbackReturnUnknown | TCallbackReturnString | void | Promise<void>, isToast: bool) => {
        if (result && TypeUtils.isString(result)) {
            if (messageRef) {
                messageRef.message = result;
            } else if (isToast) {
                Toast.Add.error(result);
            } else {
                return result;
            }
        } else {
            return result;
        }
    };

    const getHandler = <T>(error: T) => {
        if (!isAxiosError(error)) {
            if (map.nonApiError) {
                return () => handleResult(map.nonApiError!(error), false);
            } else {
                return () => {
                    console.error(error);
                    return handleResult(t("errors.Unknown error"), true);
                };
            }
        }

        const status = error.response?.status;
        const handler = map[status as EHttpStatus];
        if (!handler) {
            if (error.code === AxiosError.ERR_NETWORK) {
                if (map.networkError) {
                    return () => handleResult(map.networkError!(error), false);
                } else {
                    return () => handleResult(t("errors.Network error"), true);
                }
            }

            if (map.wildcardError) {
                return () => handleResult(map.wildcardError!(error, error.response?.data.errors), false);
            } else {
                return () => handleResult(t("errors.Internal server error"), true);
            }
        }

        return () => handleResult(handler(error, error.response?.data.errors), false);
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

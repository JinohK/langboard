/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError, isAxiosError } from "axios";
import { t } from "i18next";
import { Toast } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import TypeUtils from "@/core/utils/TypeUtils";

export type TResponseErrors = Record<string, Record<string, string[] | undefined> | undefined> | undefined;

type TCallbackReturnUnknown = unknown | Promise<unknown>;
type TCallbackReturnString = string | Promise<string>;
type TCallbackReturnVoid = void | Promise<void>;
type TCallbackReturn = TCallbackReturnUnknown | TCallbackReturnString | TCallbackReturnVoid;

interface IApiErrorHandler<TError> {
    message?: ((error: TError, responseErrors?: TResponseErrors) => TCallbackReturn) | string;
    after?: (message: TCallbackReturn, error: TError, responseErrors?: TResponseErrors) => TCallbackReturnVoid;
    toast?: bool;
}

export interface IApiErrorHandlerMap extends Partial<Record<EHttpStatus, IApiErrorHandler<AxiosError>>> {
    code?: IApiErrorHandler<string>;
    nonApi?: IApiErrorHandler<unknown>;
    network?: IApiErrorHandler<AxiosError>;
    wildcard?: IApiErrorHandler<AxiosError>;
}

export interface ISetupApiErrorHandlerProps {
    map: IApiErrorHandlerMap;
    messageRef?: { message: string };
}

const DEFAULT_CONFIGS: IApiErrorHandlerMap = {
    [EHttpStatus.HTTP_403_FORBIDDEN]: {
        message: () => t("errors.Forbidden"),
        after: (_, err) => console.error(err),
        toast: true,
    },
    code: {
        message: (code) => t(`errors.requests.${code}`),
        toast: true,
    },
    nonApi: {
        toast: true,
    },
    network: {
        message: () => t("errors.Network error"),
        toast: true,
    },
    wildcard: {
        message: () => t("errors.Internal server error"),
        toast: true,
    },
};

const setupApiErrorHandler = (configs: IApiErrorHandlerMap, messageRef?: { message: string }) => {
    const handleResult = (result: TCallbackReturn, isToast: bool) => {
        if (!result || !TypeUtils.isString(result)) {
            return result;
        }

        if (messageRef) {
            messageRef.message = result;
        } else if (isToast) {
            Toast.Add.error(result);
        } else {
            return result;
        }
    };

    const convertHandlerWithConfig = (error: any, config: IApiErrorHandler<any>): [() => TCallbackReturn, () => TCallbackReturnVoid] => {
        const responseErrors = error?.response?.data?.errors as TResponseErrors;
        const message = TypeUtils.isString(config.message) ? config.message : config.message?.(error, responseErrors);

        return [() => handleResult(message, config.toast ?? false), () => config.after?.(message, error, responseErrors)];
    };

    const convertHandler = <TKey extends keyof IApiErrorHandlerMap>(
        error: unknown,
        type: TKey
    ): [() => TCallbackReturn, () => TCallbackReturnVoid] => {
        return convertHandlerWithConfig(error, {
            ...DEFAULT_CONFIGS[type],
            ...(configs[type] ?? {}),
        });
    };

    const getHandler = <T>(error: T) => {
        if (!isAxiosError(error)) {
            return convertHandler(error, "nonApi");
        }

        const status = error.response!.status as EHttpStatus;
        const errorCode = error.response?.data?.code;
        const config = configs[status];
        if (errorCode) {
            return convertHandlerWithConfig(error, {
                message: (DEFAULT_CONFIGS.code!.message as (code: string) => string)!(errorCode),
                toast: true,
                ...(config ?? configs.code ?? {}),
            });
        }

        if (config) {
            return convertHandlerWithConfig(error, config);
        }

        if (error.code === AxiosError.ERR_NETWORK) {
            return convertHandler(error, "network");
        }

        return convertHandler(error, "wildcard");
    };

    const handle = <T>(error: T) => {
        const [handler, after] = getHandler(error);
        const result = handler();
        after();
        return result;
    };

    const handleAsync = async <T>(error: T) => {
        const [handler, after] = getHandler(error);
        const result = await handler();
        await after();
        return result;
    };

    return { handle, handleAsync };
};

export default setupApiErrorHandler;

import axios, { AxiosRequestConfig } from "axios";
import pako from "pako";
import { API_URL, APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { redirectToSignIn } from "@/core/helpers/AuthHelper";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { getCookieStore } from "@/core/stores/CookieStore";
import TypeUtils from "@/core/utils/TypeUtils";

export const api = axios.create({
    baseURL: API_URL,
    transformRequest: (axios.defaults.transformRequest
        ? Array.isArray(axios.defaults.transformRequest)
            ? axios.defaults.transformRequest
            : [axios.defaults.transformRequest]
        : []
    ).concat((data, headers) => {
        if (TypeUtils.isString(data) && data.length > 1024) {
            headers["Content-Encoding"] = "gzip";
            return pako.gzip(data);
        } else {
            headers["Content-Encoding"] = undefined;
            return data;
        }
    }),
});

export const refresh = async (): Promise<string | never> => {
    const cookieStore = getCookieStore();
    try {
        const refreshToken = cookieStore.get(APP_REFRESH_TOKEN);

        const response = await api.post(API_ROUTES.AUTH.REFRESH, undefined, {
            headers: {
                "Refresh-Token": refreshToken,
            },
        });

        if (response.status !== EHttpStatus.HTTP_200_OK) {
            const cookieStore = getCookieStore();
            cookieStore.remove(APP_ACCESS_TOKEN);
            cookieStore.remove(APP_REFRESH_TOKEN);
            redirectToSignIn();
            throw new Error("Failed to refresh token");
        }

        cookieStore.set(APP_ACCESS_TOKEN, response.data.access_token);
        return response.data.access_token;
    } catch (e) {
        redirectToSignIn();
        return Promise.reject();
    }
};

api.interceptors.request.use(
    async (config) => {
        const cookieStore = getCookieStore();
        const accessToken = cookieStore.get(APP_ACCESS_TOKEN);

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
    {
        runWhen: (config) => {
            return !config.url?.endsWith(API_ROUTES.AUTH.REFRESH);
        },
    }
);

api.interceptors.response.use(
    (value) => value,
    async (error) => {
        const { handleAsync } = setupApiErrorHandler({
            nonApiError: (e) => {
                throw e;
            },
            wildcardError: (e) => {
                throw e;
            },
            [EHttpStatus.HTTP_401_UNAUTHORIZED]: (e) => {
                redirectToSignIn();
                throw e;
            },
            [EHttpStatus.HTTP_422_UNPROCESSABLE_ENTITY]: async (e) => {
                const originalConfig: AxiosRequestConfig = e.config!;
                const token = await refresh();
                originalConfig.headers!.Authorization = `Bearer ${token}`;
                return await api(originalConfig);
            },
        });

        const result = await handleAsync(error);
        return result;
    }
);

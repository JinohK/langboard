import { createContext, useContext, useState } from "react";
import Cookies from "universal-cookie";
import { ROUTES } from "@/core/routing/constants";
import { APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";
import { API_ROUTES, REDIRECT_QUERY_NAME } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { AxiosResponse, isAxiosError } from "axios";
import EHttpStatus from "@/core/helpers/EHttpStatus";

interface IRefreshResponse {
    access_token: string;
}

export interface IAuthContext {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: () => boolean;
    signIn: (accessToken: string, refreshToken: string) => void;
    removeTokens: () => void;
    logout: () => void;
    refresh: () => Promise<AxiosResponse<IRefreshResponse> | never>;
}

interface IAuthProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    accessToken: null,
    refreshToken: null,
    isAuthenticated: () => false,
    signIn: () => {},
    removeTokens: () => {},
    logout: () => {},
    refresh: async () => Promise.reject(),
};

const AuthContext = createContext<IAuthContext>(initialContext);

export const redirectToSignIn = () => {
    const searchParams = new URLSearchParams();
    searchParams.set(REDIRECT_QUERY_NAME, window.location.href);

    location.href = `${ROUTES.SIGN_IN}?${searchParams.toString()}`;
};

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const cookies = new Cookies();
    const [accessToken, setAccessToken] = useState<string | null>(cookies.get(APP_ACCESS_TOKEN) ?? null);
    const [refreshToken, setRefreshToken] = useState<string | null>(cookies.get(APP_REFRESH_TOKEN) ?? null);

    const isAuthenticated = (): boolean => {
        return accessToken !== null && refreshToken !== null;
    };

    const signIn = (accessToken: string, refreshToken: string) => {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);

        cookies.set(APP_ACCESS_TOKEN, accessToken, { path: "/" });
        cookies.set(APP_REFRESH_TOKEN, refreshToken, { path: "/" });
    };

    const removeTokens = () => {
        setAccessToken(null);
        setRefreshToken(null);

        cookies.remove(APP_ACCESS_TOKEN, { path: "/" });
        cookies.remove(APP_REFRESH_TOKEN, { path: "/" });
    };

    const logout = () => {
        removeTokens();
        location.href = ROUTES.SIGN_IN;
    };

    const refresh = async (): Promise<AxiosResponse<IRefreshResponse>> => {
        try {
            const response = await api.post(API_ROUTES.REFRESH, undefined, {
                headers: {
                    "Refresh-Token": refreshToken,
                },
            });

            return response;
        } catch {
            removeTokens();
            redirectToSignIn();
            return Promise.reject();
        }
    };

    api.interceptors.request.use(
        (config) => {
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        (value) => value,
        async (error) => {
            if (!isAxiosError(error)) {
                return Promise.reject(error);
            }

            const isRefresh = error.request?.responseURL?.endsWith(API_ROUTES.REFRESH) ?? false;
            switch (error.status) {
                case EHttpStatus.HTTP_422_UNPROCESSABLE_ENTITY: {
                    if (isRefresh) {
                        return redirectToSignIn();
                    }

                    const response = await refresh();

                    setAccessToken(response.data.access_token);
                    return api(error.config!);
                }
                case EHttpStatus.HTTP_401_UNAUTHORIZED:
                    return redirectToSignIn();
            }
        }
    );

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                refreshToken,
                isAuthenticated,
                signIn,
                removeTokens,
                logout,
                refresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

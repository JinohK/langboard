import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { useQueryMutation } from "@/core/helpers/QueryMutation";
import { AuthUser, UserNotification } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import useCookieStore from "@/core/stores/CookieStore";
import { cleanModels } from "@/core/models/Base";
import { useTranslation } from "react-i18next";
import { AxiosError, isAxiosError } from "axios";

export interface IAuthContext {
    getAccessToken: () => string | null;
    getRefreshToken: () => string | null;
    isAuthenticated: () => bool;
    signIn: (accessToken: string, refreshToken: string) => void;
    updatedUser: () => void;
    removeTokens: () => void;
    signOut: () => void;
    aboutMe: () => AuthUser.TModel | null;
    updated: number;
}

interface IAuthProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    isAuthenticated: () => false,
    signIn: () => {},
    updatedUser: () => {},
    removeTokens: () => {},
    signOut: () => {},
    aboutMe: () => null,
    updated: 0,
};

const AuthContext = createContext<IAuthContext>(initialContext);

const ABOUT_ME_STORAGE_KEY = "about-me";
const HAS_SET_LANG_STORAGE_KEY = "has-set-lang";

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const [_, i18n] = useTranslation();
    const cookieStore = useCookieStore();
    const { queryClient } = useQueryMutation();
    const userRef = useRef<AuthUser.TModel | null>(null);
    const [updated, update] = useReducer((x) => x + 1, 0);

    const getAccessToken = (): string | null => {
        return cookieStore.get(APP_ACCESS_TOKEN) ?? null;
    };

    const getRefreshToken = (): string | null => {
        return cookieStore.get(APP_REFRESH_TOKEN) ?? null;
    };

    const isAuthenticated = (): bool => {
        return getAccessToken() !== null && getRefreshToken() !== null;
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            if (userRef.current) {
                userRef.current = null;
            }
            return;
        }

        const getUser = async () => {
            const cachedData = sessionStorage.getItem(ABOUT_ME_STORAGE_KEY);
            if (cachedData) {
                const { expiresAt, userUID } = JSON.parse(cachedData);
                if (expiresAt > Date.now()) {
                    const cachedUser = AuthUser.Model.getModel(userUID);
                    if (cachedUser) {
                        userRef.current = cachedUser;
                        return;
                    }
                }

                sessionStorage.removeItem(ABOUT_ME_STORAGE_KEY);
                userRef.current = null;
            }

            let response;
            try {
                response = await api.get<{ user: AuthUser.Interface; notifications: UserNotification.Interface[] }>(API_ROUTES.AUTH.ABOUT_ME, {
                    headers: {
                        Authorization: `Bearer ${getAccessToken()}`,
                    },
                });
            } catch (error) {
                if (isAxiosError(error) && error.code === AxiosError.ERR_NETWORK) {
                    setTimeout(() => {
                        update();
                    }, 5000);
                }
                return;
            }

            const user = AuthUser.Model.fromObject(response.data.user);
            UserNotification.Model.fromObjectArray(response.data.notifications);

            const hasSetLang = localStorage.getItem(HAS_SET_LANG_STORAGE_KEY);
            if (!hasSetLang) {
                i18n.changeLanguage(user.preferred_lang);
                localStorage.setItem(HAS_SET_LANG_STORAGE_KEY, "true");
            }

            sessionStorage.setItem(
                ABOUT_ME_STORAGE_KEY,
                JSON.stringify({
                    userUID: user.uid,
                    expiresAt: Date.now() + 1000 * 60 * 5,
                })
            );

            userRef.current = user;
            update();
            return;
        };

        getUser();
    }, [updated]);

    const updatedUser = () => {
        sessionStorage.removeItem(ABOUT_ME_STORAGE_KEY);
        userRef.current = null;
        update();
    };

    const removeTokens = () => {
        cookieStore.remove(APP_ACCESS_TOKEN);
        cookieStore.remove(APP_REFRESH_TOKEN);
    };

    const signIn = (accessToken: string, refreshToken: string) => {
        cookieStore.set(APP_ACCESS_TOKEN, accessToken);
        cookieStore.set(APP_REFRESH_TOKEN, refreshToken);
        update();
    };

    const signOut = () => {
        userRef.current = null;
        cleanModels();
        sessionStorage.removeItem(ABOUT_ME_STORAGE_KEY);
        removeTokens();
        queryClient.clear();
        location.href = ROUTES.SIGN_IN.EMAIL;
    };

    const aboutMe = () => {
        return userRef.current;
    };

    return (
        <AuthContext.Provider
            value={{
                getAccessToken,
                getRefreshToken,
                isAuthenticated,
                signIn,
                updatedUser,
                removeTokens,
                signOut,
                aboutMe,
                updated,
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

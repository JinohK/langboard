import { createContext, useContext } from "react";
import Cookies from "universal-cookie";
import { ROUTES } from "@/core/routing/constants";
import { APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { IUser } from "@/core/types";
import { useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IAuthUser extends IUser {
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
}

export interface IAuthContext {
    getAccessToken: () => string | null;
    getRefreshToken: () => string | null;
    isAuthenticated: () => boolean;
    signIn: (accessToken: string, refreshToken: string) => void;
    removeTokens: () => void;
    signOut: () => void;
    aboutMe: () => Promise<IAuthUser>;
}

interface IAuthProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    isAuthenticated: () => false,
    signIn: () => {},
    removeTokens: () => {},
    signOut: () => {},
    aboutMe: async () => Promise.reject(),
};

const AuthContext = createContext<IAuthContext>(initialContext);

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const cookies = new Cookies();
    const { queryClient } = useQueryMutation();

    const getAccessToken = (): string | null => {
        return cookies.get(APP_ACCESS_TOKEN) ?? null;
    };

    const getRefreshToken = (): string | null => {
        return cookies.get(APP_REFRESH_TOKEN) ?? null;
    };

    const isAuthenticated = (): boolean => {
        return getAccessToken() !== null && getRefreshToken() !== null;
    };

    const removeTokens = () => {
        cookies.remove(APP_ACCESS_TOKEN, { path: "/" });
        cookies.remove(APP_REFRESH_TOKEN, { path: "/" });
    };

    const signIn = (accessToken: string, refreshToken: string) => {
        cookies.set(APP_ACCESS_TOKEN, accessToken, { path: "/" });
        cookies.set(APP_REFRESH_TOKEN, refreshToken, { path: "/" });
    };

    const signOut = () => {
        removeTokens();
        queryClient.clear();
        location.href = ROUTES.SIGN_IN.EMAIL;
    };

    const aboutMe = async () => {
        const cachedData = sessionStorage.getItem("about-me");
        if (cachedData) {
            const { expiresAt, user } = JSON.parse(cachedData);
            if (expiresAt > Date.now()) {
                return user;
            }

            sessionStorage.removeItem("about-me");
        }

        const response = await api.get(API_ROUTES.AUTH.ABOUT_ME, {
            headers: {
                Authorization: `Bearer ${getAccessToken()}`,
            },
        });

        sessionStorage.setItem(
            "about-me",
            JSON.stringify({
                user: response.data.user,
                expiresAt: Date.now() + 1000 * 60 * 5,
            })
        );

        return response.data.user;
    };

    return (
        <AuthContext.Provider
            value={{
                getAccessToken,
                getRefreshToken,
                isAuthenticated,
                signIn,
                removeTokens,
                signOut,
                aboutMe,
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

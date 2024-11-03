import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import Cookies from "universal-cookie";
import { API_URL, APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";

export interface IAuthUser extends User.Interface {
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
}

export interface IAuthContext {
    getAccessToken: () => string | null;
    getRefreshToken: () => string | null;
    isAuthenticated: () => bool;
    signIn: (accessToken: string, refreshToken: string) => void;
    updatedUser: () => void;
    removeTokens: () => void;
    signOut: () => void;
    aboutMe: () => IAuthUser | null;
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
};

const AuthContext = createContext<IAuthContext>(initialContext);

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const cookies = new Cookies();
    const { queryClient } = useQueryMutation();
    const user = useRef<IAuthUser | null>(null);
    const [updated, update] = useReducer((x) => x + 1, 0);

    const getAccessToken = (): string | null => {
        return cookies.get(APP_ACCESS_TOKEN) ?? null;
    };

    const getRefreshToken = (): string | null => {
        return cookies.get(APP_REFRESH_TOKEN) ?? null;
    };

    const isAuthenticated = (): bool => {
        return getAccessToken() !== null && getRefreshToken() !== null;
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            if (user.current) {
                user.current = null;
            }
            return;
        }

        const getUser = async () => {
            const cachedData = sessionStorage.getItem("about-me");
            if (cachedData) {
                const { expiresAt, user: cachedUser } = JSON.parse(cachedData);
                if (expiresAt > Date.now()) {
                    user.current = cachedUser;
                    return;
                }

                sessionStorage.removeItem("about-me");
                user.current = null;
            }

            const response = await api.get(API_ROUTES.AUTH.ABOUT_ME, {
                headers: {
                    Authorization: `Bearer ${getAccessToken()}`,
                },
            });

            if (response.data.user.avatar) {
                response.data.user.avatar = `${API_URL}${response.data.user.avatar}`;
            }

            sessionStorage.setItem(
                "about-me",
                JSON.stringify({
                    user: response.data.user,
                    expiresAt: Date.now() + 1000 * 60 * 5,
                })
            );

            user.current = response.data.user;
            return;
        };

        getUser();
    }, [updated]);

    const updatedUser = () => {
        update();
    };

    const removeTokens = () => {
        cookies.remove(APP_ACCESS_TOKEN, { path: "/" });
        cookies.remove(APP_REFRESH_TOKEN, { path: "/" });
    };

    const signIn = (accessToken: string, refreshToken: string) => {
        cookies.set(APP_ACCESS_TOKEN, accessToken, { path: "/" });
        cookies.set(APP_REFRESH_TOKEN, refreshToken, { path: "/" });
        update();
    };

    const signOut = () => {
        user.current = null;
        sessionStorage.removeItem("about-me");
        removeTokens();
        queryClient.clear();
        location.href = ROUTES.SIGN_IN.EMAIL;
    };

    const aboutMe = () => {
        return user.current;
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

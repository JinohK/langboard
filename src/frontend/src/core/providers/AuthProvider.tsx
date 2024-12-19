import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { APP_ACCESS_TOKEN, APP_REFRESH_TOKEN } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import useCookieStore from "@/core/stores/CookieStore";

export interface IAuthUser extends User.Interface {
    is_admin?: bool;
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
    user_groups: { id: number; name: string; users: User.Interface[] }[];
    subemails: { email: string; verified_at: string }[];
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

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const cookieStore = useCookieStore();
    const { queryClient } = useQueryMutation();
    const userRef = useRef<IAuthUser | null>(null);
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
            const cachedData = sessionStorage.getItem("about-me");
            if (cachedData) {
                const { expiresAt, user: cachedUser } = JSON.parse(cachedData);
                if (expiresAt > Date.now()) {
                    userRef.current = cachedUser;
                    return;
                }

                sessionStorage.removeItem("about-me");
                userRef.current = null;
            }

            const response = await api.get(API_ROUTES.AUTH.ABOUT_ME, {
                headers: {
                    Authorization: `Bearer ${getAccessToken()}`,
                },
            });

            User.transformFromApi(response.data.user);

            sessionStorage.setItem(
                "about-me",
                JSON.stringify({
                    user: response.data.user,
                    expiresAt: Date.now() + 1000 * 60 * 5,
                })
            );

            userRef.current = response.data.user;
            update();
            return;
        };

        getUser();
    }, [updated]);

    const updatedUser = () => {
        sessionStorage.removeItem("about-me");
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
        sessionStorage.removeItem("about-me");
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

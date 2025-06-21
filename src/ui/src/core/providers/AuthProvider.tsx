import { createContext, useContext, useEffect, useRef } from "react";
import { APP_SHORT_NAME } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api, refresh } from "@/core/helpers/Api";
import { useQueryMutation } from "@/core/helpers/QueryMutation";
import { AuthUser } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import { cleanModels } from "@/core/models/Base";
import { useTranslation } from "react-i18next";
import useAuthStore from "@/core/stores/AuthStore";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/base";

export interface IAuthContext {
    signIn: (accessToken: string, redirectCallback?: () => void) => Promise<void>;
    updatedUser: () => void;
    signOut: () => Promise<void>;
    currentUser: AuthUser.TModel | null;
}

interface IAuthProviderProps {
    children: React.ReactNode;
}

const initialContext = {
    signIn: () => Promise.resolve(),
    updatedUser: () => {},
    signOut: async () => {},
    currentUser: null,
};

const AuthContext = createContext<IAuthContext>(initialContext);

const HAS_SET_LANG_STORAGE_KEY = `has-set-lang-${APP_SHORT_NAME}`;

export const AuthProvider = ({ children }: IAuthProviderProps): React.ReactNode => {
    const [_, i18n] = useTranslation();
    const { queryClient } = useQueryMutation();
    const { state, currentUser, pageLoaded, updateToken, removeToken } = useAuthStore();
    const navigateRef = useRef(useNavigate());

    useEffect(() => {
        if (state !== "loaded" || !currentUser) {
            return;
        }

        const hasSetLang = localStorage.getItem(HAS_SET_LANG_STORAGE_KEY);
        if (!hasSetLang) {
            i18n.changeLanguage(currentUser.preferred_lang);
            localStorage.setItem(HAS_SET_LANG_STORAGE_KEY, "true");
        }
    }, [state]);

    useEffect(() => {
        switch (state) {
            case "initial":
                refresh();
                return;
            case "loaded":
                if (!currentUser) {
                    navigateRef.current(ROUTES.SIGN_IN.EMAIL);
                }
                return;
        }
    }, [state]);

    const updatedUser = () => {
        refresh();
    };

    const signIn = async (accessToken: string, redirectCallback?: () => void) => {
        await updateToken(accessToken, api);
        redirectCallback?.();
    };

    const signOut = async () => {
        await api.post(API_ROUTES.AUTH.SIGN_OUT);
        cleanModels();
        removeToken();
        queryClient.clear();
        navigateRef.current(ROUTES.SIGN_IN.EMAIL);
    };

    return (
        <AuthContext.Provider
            value={{
                signIn,
                updatedUser,
                signOut,
                currentUser,
            }}
        >
            {(!pageLoaded || state !== "loaded") && <Progress indeterminate height="1" className="fixed top-0 z-[9999999]" />}
            {state === "loaded" ? children : null}
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

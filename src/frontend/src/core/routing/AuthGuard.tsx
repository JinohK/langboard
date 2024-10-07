import { redirectToLogin, useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";

export interface IAuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard = ({ children }: IAuthGuardProps): React.ReactNode => {
    const { isAuthenticated, removeTokens } = useAuth();
    const isLoginPage = location.pathname.startsWith(ROUTES.LOGIN);

    if (!isAuthenticated() && !isLoginPage) {
        removeTokens();
        redirectToLogin();
    } else {
        return children;
    }
};

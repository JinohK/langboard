import { redirectToSignIn } from "@/core/helpers/AuthHelper";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";

export interface IAuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard = ({ children }: IAuthGuardProps): React.ReactNode => {
    const { isAuthenticated, removeTokens } = useAuth();
    const isSignInPage = location.pathname.startsWith(ROUTES.SIGN_IN.EMAIL);

    if (!isAuthenticated() && !isSignInPage) {
        removeTokens();
        redirectToSignIn();
    } else {
        return children;
    }
};

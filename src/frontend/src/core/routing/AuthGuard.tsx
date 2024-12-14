import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import { RedirectToSignIn } from "@/core/helpers/AuthHelper";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { useSocket } from "@/core/providers/SocketProvider";

export interface IAuthGuardProps {
    children: React.ReactNode;
    message?: string;
}

export const AuthGuard = ({ children, message }: IAuthGuardProps): React.ReactNode => {
    const [t] = useTranslation();
    const { isAuthenticated, removeTokens } = useAuth();
    const { close } = useSocket();
    const isSignInPage = location.pathname.startsWith(ROUTES.SIGN_IN.EMAIL);

    if (!isAuthenticated() && !isSignInPage) {
        removeTokens();
        close();
        if (message) {
            Toast.Add.error(t(message));
        }
        return <RedirectToSignIn />;
    } else {
        return children;
    }
};

import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider";
import { REDIRECT_QUERY_NAME, ROUTES } from "@/core/routing/constants";

export interface IProtectedAuthRouteProps {
    children: React.ReactNode;
}

export const ProtectedAuthRoute = ({ children }: IProtectedAuthRouteProps): React.ReactNode => {
    const { isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get(REDIRECT_QUERY_NAME);

    if (isAuthenticated()) {
        if (redirectUrl) {
            location.href = redirectUrl;
        } else {
            return <Navigate to={ROUTES.AFTER_SIGN_IN} />;
        }
    } else {
        return children;
    }
};

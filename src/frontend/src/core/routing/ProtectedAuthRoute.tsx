import { Navigate, useSearchParams } from "react-router-dom";
import { QUERY_NAMES } from "@/constants";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";

export interface IProtectedAuthRouteProps {
    children: React.ReactNode;
}

export const ProtectedAuthRoute = ({ children }: IProtectedAuthRouteProps): React.ReactNode => {
    const { isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get(QUERY_NAMES.REDIRECT);

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

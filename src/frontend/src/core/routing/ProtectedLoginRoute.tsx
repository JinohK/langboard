import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { Navigate, useSearchParams } from "react-router-dom";

export interface IProtectedLoginRouteProps {
    children: React.ReactNode;
}

export const ProtectedLoginRoute = ({ children }: IProtectedLoginRouteProps): React.ReactNode => {
    const { isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get("continue");

    if (isAuthenticated()) {
        if (redirectUrl) {
            return <Navigate to={redirectUrl} />;
        } else {
            return <Navigate to={ROUTES.AFTER_LOGIN} />;
        }
    } else {
        return children;
    }
};

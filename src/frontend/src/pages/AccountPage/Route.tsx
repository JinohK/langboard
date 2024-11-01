import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const AccountPage = lazy(() => import("./index"));

function AccountRoute() {
    return (
        <Route path={ROUTES.ACCOUNT.ROUTE} key="route-account">
            <Route
                index
                element={
                    <AuthGuard>
                        <Navigate to={ROUTES.ACCOUNT.PROFILE} />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.ACCOUNT.PROFILE}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.ACCOUNT.EMAIL}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.ACCOUNT.PASSWORD}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
        </Route>
    );
}

export default AccountRoute;

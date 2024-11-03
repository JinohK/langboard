import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedAuthRoute } from "@/core/routing/ProtectedAuthRoute";
import { ROUTES } from "@/core/routing/constants";

const AccountRecoveryPage = lazy(() => import("."));

function AccountRecoveryRoute() {
    return (
        <Route path={ROUTES.ACCOUNT_RECOVERY.NAME} key="route-find-password">
            <Route
                index
                element={
                    <ProtectedAuthRoute>
                        <AccountRecoveryPage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.ACCOUNT_RECOVERY.RESET}
                element={
                    <ProtectedAuthRoute>
                        <AccountRecoveryPage />
                    </ProtectedAuthRoute>
                }
            />
        </Route>
    );
}

export default AccountRecoveryRoute;

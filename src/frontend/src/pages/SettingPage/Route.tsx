import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const SettingPage = lazy(() => import("./index"));

function SettingRoute() {
    return (
        <Route path={ROUTES.SETTINGS.ROUTE} key="route-settings">
            <Route
                index
                element={
                    <AuthGuard>
                        <Navigate to={ROUTES.SETTINGS.EDIT_PROFILE} />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.SETTINGS.EDIT_PROFILE}
                element={
                    <AuthGuard>
                        <SettingPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.SETTINGS.CHANGE_PASSWORD}
                element={
                    <AuthGuard>
                        <SettingPage />
                    </AuthGuard>
                }
            />
        </Route>
    );
}

export default SettingRoute;

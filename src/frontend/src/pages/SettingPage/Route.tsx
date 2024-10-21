import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import { lazy } from "react";
import { Route } from "react-router-dom";

const SettingPage = lazy(() => import("./index"));

function SettingRoute() {
    return (
        <Route path={ROUTES.SETTINGS} key="route-settings">
            <Route
                index
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

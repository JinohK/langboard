import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import { lazy } from "react";
import { Route } from "react-router-dom";

const DashboardPage = lazy(() => import("./index"));

function DashboardRoute() {
    return (
        <Route path={ROUTES.DASHBOARD.MAIN} key="route-dashboard">
            <Route
                index
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.OUTLINES}
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.TRACKING}
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
        </Route>
    );
}

export default DashboardRoute;

import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";

const DashboardPage = lazy(() => import("./index"));

function DashboardRoute() {
    return (
        <Route path={ROUTES.DASHBOARD.ROUTE} key="route-dashboard">
            <Route
                index
                element={
                    <AuthGuard>
                        <Navigate to={ROUTES.DASHBOARD.PROJECTS.ALL} />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.PROJECTS.ALL}
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.PROJECTS.STARRED}
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.PROJECTS.RECENT}
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.PROJECTS.UNSTARRED}
                element={
                    <AuthGuard>
                        <DashboardPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.DASHBOARD.CARDS}
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
            <Route
                path={`${ROUTES.DASHBOARD.ROUTE}/*`}
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

import { lazy } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import ModalPage from "@/pages/DashboardPage/ModalPage";

const DashboardPage = lazy(() => import("./index"));

function DashboardRoute() {
    const mainElement = (
        <AuthGuard>
            <DashboardPage />
            <Outlet />
        </AuthGuard>
    );

    const createModalRoutePath = (type: string, modal: string, tabName?: string) => {
        if (tabName) {
            return ROUTES.DASHBOARD.PROJECTS.TAB(`${tabName}/${modal}`);
        } else {
            return ROUTES.DASHBOARD.PAGE_TYPE(`${type}/${modal}`);
        }
    };

    const createModalRoutes = (type: string, tabName?: string) => {
        return (
            <>
                <Route path={createModalRoutePath(type, "new-project", tabName)} element={<ModalPage />} />
                <Route path={createModalRoutePath(type, "my-activity", tabName)} element={<ModalPage />} />
            </>
        );
    };

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
            <Route path={ROUTES.DASHBOARD.CARDS} element={mainElement}>
                {createModalRoutes("cards")}
            </Route>
            <Route path={ROUTES.DASHBOARD.TRACKING} element={mainElement}>
                {createModalRoutes("tracking")}
            </Route>
            <Route path={ROUTES.DASHBOARD.PROJECTS.TAB(":tabType")} element={mainElement}>
                {createModalRoutes("projects", ":tabType")}
            </Route>
        </Route>
    );
}

export default DashboardRoute;

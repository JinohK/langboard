import { lazy } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import ModalPage from "@/pages/DashboardPage/ModalPage";

const DashboardProxy = lazy(() => import("./index"));

function DashboardRoute() {
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
        <Route
            path={ROUTES.DASHBOARD.ROUTE}
            key="route-dashboard"
            element={
                <AuthGuard>
                    <DashboardProxy />
                    <Outlet />
                </AuthGuard>
            }
        >
            <Route index element={<Navigate to={ROUTES.DASHBOARD.PROJECTS.ALL} />} />
            <Route path={ROUTES.DASHBOARD.CARDS} element={<></>} />
            <Route path={ROUTES.DASHBOARD.TRACKING} element={<></>} />
            <Route path={ROUTES.DASHBOARD.PROJECTS.TAB(":tabType")} element={<></>} />
            {createModalRoutes("cards")}
            {createModalRoutes("tracking")}
            {createModalRoutes("projects", ":tabType")}
        </Route>
    );
}

export default DashboardRoute;

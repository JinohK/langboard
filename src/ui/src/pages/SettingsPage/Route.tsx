import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import ModalPage from "@/pages/SettingsPage/ModalPage";
import { lazy } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";

const SettingsProxy = lazy(() => import("./index"));

function SettingsRoute() {
    return (
        <Route
            path={ROUTES.SETTINGS.ROUTE}
            element={
                <AuthGuard>
                    <SettingsProxy />
                    <Outlet />
                </AuthGuard>
            }
            key="route-settings"
        >
            <Route index element={<Navigate to={ROUTES.SETTINGS.API_KEYS} replace />} />
            <Route path={ROUTES.SETTINGS.API_KEYS} element={<></>} />
            <Route path={ROUTES.SETTINGS.BOTS} element={<></>} />
            <Route path={ROUTES.SETTINGS.BOT_DETAILS(":botUID")} element={<></>} />
            <Route path={ROUTES.SETTINGS.INTERNAL_BOTS} element={<></>} />
            <Route path={ROUTES.SETTINGS.INTERNAL_BOT_DETAILS(":botUID")} element={<></>} />
            <Route path={ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS} element={<></>} />
            <Route path={ROUTES.SETTINGS.WEBHOOKS} element={<></>} />

            <Route path={ROUTES.SETTINGS.CREATE_API_KEY} element={<ModalPage />} />
            <Route path={ROUTES.SETTINGS.CREATE_BOT} element={<ModalPage />} />
            <Route path={ROUTES.SETTINGS.CREATE_INTERNAL_BOT} element={<ModalPage />} />
            <Route path={ROUTES.SETTINGS.CREATE_GLOBAL_RELATIONSHIP} element={<ModalPage />} />
            <Route path={ROUTES.SETTINGS.CREATE_WEBHOOK} element={<ModalPage />} />
        </Route>
    );
}

export default SettingsRoute;

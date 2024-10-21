import { ROUTES } from "@/core/routing/constants";
import { lazy } from "react";
import { Route } from "react-router-dom";

const ErrorPage = lazy(() => import("./index"));

function ErrorRoute() {
    return (
        <Route path={ROUTES.ERROR("*").replace("/*", "")} key="route-error">
            <Route path={ROUTES.ERROR("*")} element={<ErrorPage />} />
        </Route>
    );
}

export default ErrorRoute;

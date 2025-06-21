import { ROUTES } from "@/core/routing/constants";
import Redirect from "@/pages/HomePage/Redirect";
import { lazy } from "react";
import { Route } from "react-router-dom";

const HomePage = lazy(() => import("./index"));

function HomeRoute() {
    return (
        <Route path="/" key="route-home">
            <Route index element={<HomePage />} />
            <Route path={ROUTES.REDIRECT} element={<Redirect />} />
        </Route>
    );
}

export default HomeRoute;

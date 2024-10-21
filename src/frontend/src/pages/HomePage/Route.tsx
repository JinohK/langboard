import { lazy } from "react";
import { Route } from "react-router-dom";

const HomePage = lazy(() => import("./index"));

function HomeRoute() {
    return <Route path="/" element={<HomePage />} key="route-home" />;
}

export default HomeRoute;

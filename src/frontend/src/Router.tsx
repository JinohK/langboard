import { Await, BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SocketRouteWrapper } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { SuspenseComponent } from "@/components/base";

const modules = import.meta.glob<boolean, string, { default: () => JSX.Element }>("./pages/**/Route.tsx");
const pages = Object.values(modules);

const loadRoutes = async () => {
    const routes = await Promise.all(
        pages.map(async (importPage) => {
            const Page = (await importPage()).default;
            return Page();
        })
    );

    routes.push(<Route key="route-notfound" path="*" element={<Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />} />);

    return routes;
};

const Router = () => (
    <SuspenseComponent shouldWrapChildren={false} isPage>
        <Await
            resolve={loadRoutes()}
            children={(routes) => (
                <BrowserRouter>
                    <SocketRouteWrapper>
                        <Routes>{routes}</Routes>
                    </SocketRouteWrapper>
                </BrowserRouter>
            )}
        />
    </SuspenseComponent>
);

export default Router;

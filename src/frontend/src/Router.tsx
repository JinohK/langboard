import { Await, BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SuspenseComponent } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { SocketRouteWrapper } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { Suspense } from "react";

const modules = import.meta.glob<{ default: () => JSX.Element }>("./pages/**/Route.tsx");
const pages = Object.values(modules);

const loadRoutes = async () => {
    const routes = await Promise.all(
        pages.map(async (importPage) => {
            const Page = (await importPage()).default;
            try {
                return Page();
            } catch (error) {
                console.error("Error occurred while loading route:", Page.name);
                throw error;
            }
        })
    );

    routes.push(<Route key="route-notfound" path="*" element={<Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />} />);

    return routes;
};

const Router = () => (
    <Suspense>
        <Await
            resolve={loadRoutes()}
            children={(routes) => (
                <SuspenseComponent shouldWrapChildren={false} isPage>
                    <BrowserRouter>
                        <SocketRouteWrapper>
                            <Routes>{routes}</Routes>
                        </SocketRouteWrapper>
                    </BrowserRouter>
                </SuspenseComponent>
            )}
        />
    </Suspense>
);

export default Router;

import { Await, Navigate, Route, Routes } from "react-router-dom";
import { SuspenseComponent } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import { memo, Suspense } from "react";
import useAuthStore from "@/core/stores/AuthStore";
import SwallowErrorBoundary from "@/components/SwallowErrorBoundary";

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

    useAuthStore.setState(() => ({
        pageLoaded: true,
    }));

    return routes;
};

const Router = memo(() => {
    return (
        <Suspense>
            <Await
                resolve={loadRoutes()}
                children={(routes) => (
                    <SwallowErrorBoundary>
                        <SuspenseComponent shouldWrapChildren={false} isPage>
                            <Routes>{routes}</Routes>
                        </SuspenseComponent>
                    </SwallowErrorBoundary>
                )}
            />
        </Suspense>
    );
});

export default Router;

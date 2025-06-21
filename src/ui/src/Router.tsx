import { Await, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { SuspenseComponent } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import { memo, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import useAuthStore from "@/core/stores/AuthStore";

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
                    <SuspenseComponent shouldWrapChildren={false} isPage>
                        <Routes>
                            <Route
                                element={
                                    <ErrorBoundary
                                        FallbackComponent={(error) => {
                                            console.error(error);
                                            return <></>;
                                        }}
                                    >
                                        <Outlet />
                                    </ErrorBoundary>
                                }
                            >
                                {routes}
                            </Route>
                        </Routes>
                    </SuspenseComponent>
                )}
            />
        </Suspense>
    );
});

export default Router;

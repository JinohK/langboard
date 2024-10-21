import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SocketRouteWrapper } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { useEffect, useState } from "react";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { Progress } from "@/components/base";

const modules = import.meta.glob<boolean, string, { default: () => JSX.Element }>("./pages/**/Route.tsx");
const pages = Object.values(modules);

const Router = () => {
    const [routes, setRoutes] = useState<JSX.Element[]>([]);

    useEffect(() => {
        const loadRoutes = async () => {
            const newRoutes = await Promise.all(
                pages.map(async (importPage) => {
                    const Page = (await importPage()).default;
                    return Page();
                })
            );

            newRoutes.push(<Route key="route-notfound" path="*" element={<Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />} />);

            setRoutes(newRoutes);
        };

        loadRoutes();
    }, []);

    if (routes.length === 0) {
        return <Progress indeterminate height="1" />;
    }

    return (
        <BrowserRouter>
            <SocketRouteWrapper>
                <Routes>{routes}</Routes>
            </SocketRouteWrapper>
        </BrowserRouter>
    );
};

export default Router;

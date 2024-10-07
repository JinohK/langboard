import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import { ROUTES } from "@/core/routing/constants";
import { ProtectedLoginRoute } from "@/core/routing/ProtectedLoginRoute";
import { AuthGuard } from "@/core/routing/AuthGuard";
import DashboardPage from "@/pages/DashboardPage";
import { SocketRouteWrapper } from "@/core/providers/SocketProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

const Router = () => {
    return (
        <BrowserRouter>
            <SocketRouteWrapper>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path={ROUTES.LOGIN}>
                        <Route
                            index
                            element={
                                <ProtectedLoginRoute>
                                    <LoginPage />
                                </ProtectedLoginRoute>
                            }
                        />
                        <Route
                            path={ROUTES.LOGIN_PASSWORD}
                            element={
                                <ProtectedLoginRoute>
                                    <LoginPage />
                                </ProtectedLoginRoute>
                            }
                        />
                    </Route>
                    <Route
                        path={ROUTES.DASHBOARD}
                        element={
                            <AuthGuard>
                                <DashboardPage />
                            </AuthGuard>
                        }
                    />
                </Routes>
            </SocketRouteWrapper>
        </BrowserRouter>
    );
};

export default Router;

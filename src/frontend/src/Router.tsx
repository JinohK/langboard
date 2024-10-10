import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import { ROUTES } from "@/core/routing/constants";
import { ProtectedAuthRoute } from "@/core/routing/ProtectedAuthRoute";
import { AuthGuard } from "@/core/routing/AuthGuard";
import DashboardPage from "@/pages/DashboardPage";
import { SocketRouteWrapper } from "@/core/providers/SocketProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));

const Router = () => {
    return (
        <BrowserRouter>
            <SocketRouteWrapper>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path={ROUTES.SIGN_IN}>
                        <Route
                            index
                            element={
                                <ProtectedAuthRoute>
                                    <SignInPage />
                                </ProtectedAuthRoute>
                            }
                        />
                        <Route
                            path={ROUTES.SIGN_IN_PASSWORD}
                            element={
                                <ProtectedAuthRoute>
                                    <SignInPage />
                                </ProtectedAuthRoute>
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

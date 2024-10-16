import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import { ROUTES } from "@/core/routing/constants";
import { ProtectedAuthRoute } from "@/core/routing/ProtectedAuthRoute";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { SocketRouteWrapper } from "@/core/providers/SocketProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingPage = lazy(() => import("./pages/SettingPage"));

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
                    <Route path={ROUTES.SETTINGS}>
                        <Route
                            index
                            element={
                                <AuthGuard>
                                    <SettingPage />
                                </AuthGuard>
                            }
                        />
                    </Route>
                </Routes>
            </SocketRouteWrapper>
        </BrowserRouter>
    );
};

export default Router;

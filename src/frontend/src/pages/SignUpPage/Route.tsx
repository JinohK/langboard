import { ROUTES } from "@/core/routing/constants";
import { ProtectedAuthRoute } from "@/core/routing/ProtectedAuthRoute";
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const SignUpPage = lazy(() => import("./index"));
const CompletePage = lazy(() => import("./CompletePage"));
const ActivatePage = lazy(() => import("./ActivatePage"));

function SignUpRoute() {
    const searchParams = new URLSearchParams(location.search);
    return (
        <Route path={ROUTES.SIGN_UP.ROUTE} key="route-sign-up">
            <Route
                index
                element={
                    <ProtectedAuthRoute>
                        <Navigate to={`${ROUTES.SIGN_UP.REQUIRED}?${searchParams.toString()}`} replace />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_UP.REQUIRED}
                element={
                    <ProtectedAuthRoute>
                        <SignUpPage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_UP.ADDITIONAL}
                element={
                    <ProtectedAuthRoute>
                        <SignUpPage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_UP.OPTIONAL}
                element={
                    <ProtectedAuthRoute>
                        <SignUpPage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_UP.OVERVIEW}
                element={
                    <ProtectedAuthRoute>
                        <SignUpPage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_UP.COMPLETE}
                element={
                    <ProtectedAuthRoute>
                        <CompletePage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_UP.ACTIVATE}
                element={
                    <ProtectedAuthRoute>
                        <ActivatePage />
                    </ProtectedAuthRoute>
                }
            />
        </Route>
    );
}

export default SignUpRoute;

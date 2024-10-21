import { ROUTES } from "@/core/routing/constants";
import { ProtectedAuthRoute } from "@/core/routing/ProtectedAuthRoute";
import { lazy } from "react";
import { Route } from "react-router-dom";

const SignInPage = lazy(() => import("./index"));

function SignInRoute() {
    return (
        <Route path={ROUTES.SIGN_IN.EMAIL} key="route-sign-in">
            <Route
                index
                element={
                    <ProtectedAuthRoute>
                        <SignInPage />
                    </ProtectedAuthRoute>
                }
            />
            <Route
                path={ROUTES.SIGN_IN.PASSWORD}
                element={
                    <ProtectedAuthRoute>
                        <SignInPage />
                    </ProtectedAuthRoute>
                }
            />
        </Route>
    );
}

export default SignInRoute;

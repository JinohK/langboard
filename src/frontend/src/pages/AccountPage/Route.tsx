import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";

const AccountPage = lazy(() => import("./index"));
const EmailVerificationPage = lazy(() => import("./EmailVerificationPage"));

function AccountRoute() {
    return (
        <Route path={ROUTES.ACCOUNT.ROUTE} key="route-account">
            <Route
                index
                element={
                    <AuthGuard>
                        <Navigate to={ROUTES.ACCOUNT.PROFILE} replace />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.ACCOUNT.PROFILE}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
            <Route
                index
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
            <Route path={ROUTES.ACCOUNT.EMAILS.ROUTE}>
                <Route
                    index
                    element={
                        <AuthGuard>
                            <AccountPage />
                        </AuthGuard>
                    }
                />
                <Route
                    path={ROUTES.ACCOUNT.EMAILS.VERIFY}
                    element={
                        <AuthGuard message="myAccount.errors.You must sign in before verifying your email.">
                            <EmailVerificationPage />
                        </AuthGuard>
                    }
                />
            </Route>
            <Route
                path={ROUTES.ACCOUNT.PASSWORD}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.ACCOUNT.GROUPS}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.ACCOUNT.PREFERENCES}
                element={
                    <AuthGuard>
                        <AccountPage />
                    </AuthGuard>
                }
            />
        </Route>
    );
}

export default AccountRoute;

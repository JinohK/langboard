import { lazy } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import BoardCardPage from "@/pages/BoardPage/BoardCardPage";

const BoardPage = lazy(() => import("./index"));

function BoardRoute() {
    return (
        <Route path={ROUTES.BOARD.ROUTE} key="route-board">
            <Route index element={<Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />} />
            <Route
                path={ROUTES.BOARD.MAIN(":projectUID")}
                element={
                    <AuthGuard>
                        <BoardPage />
                        <Outlet />
                    </AuthGuard>
                }
            >
                <Route
                    path={ROUTES.BOARD.CARD(":projectUID", ":cardUID")}
                    element={
                        <AuthGuard>
                            <BoardCardPage />
                        </AuthGuard>
                    }
                />
            </Route>
        </Route>
    );
}

export default BoardRoute;

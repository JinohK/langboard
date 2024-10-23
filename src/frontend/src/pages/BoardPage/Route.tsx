import EHttpStatus from "@/core/helpers/EHttpStatus";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const BoardPage = lazy(() => import("./index"));

function BoardRoute() {
    return (
        <Route path={ROUTES.BOARD.ROUTE} key="route-board">
            <Route index element={<Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} />} />
            <Route
                path={ROUTES.BOARD.MAIN("*")}
                element={
                    <AuthGuard>
                        <BoardPage />
                    </AuthGuard>
                }
            />
        </Route>
    );
}

export default BoardRoute;

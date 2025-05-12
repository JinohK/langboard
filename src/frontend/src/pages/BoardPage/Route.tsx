import { lazy } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import BoardCardPage from "@/pages/BoardPage/BoardCardPage";
import { BoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import BoardActivityDialog from "@/pages/BoardPage/components/board/BoardActivityDialog";
import WikiActivityDialog from "@/pages/BoardPage/components/wiki/WikiActivityDialog";
import WikiMetadataDialog from "@/pages/BoardPage/components/wiki/WikiMetadataDialog";

const BoardProxy = lazy(() => import("./index"));
const BoardInvitationPage = lazy(() => import("./BoardInvitationPage"));

function BoardRoute() {
    return (
        <Route path={ROUTES.BOARD.ROUTE} key="route-board">
            <Route index element={<Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />} />
            <Route
                path={ROUTES.BOARD.INVITATION}
                element={
                    <AuthGuard>
                        <BoardInvitationPage />
                    </AuthGuard>
                }
            />
            <Route
                path={ROUTES.BOARD.MAIN(":projectUID")}
                element={
                    <AuthGuard>
                        <BoardRelationshipController>
                            <BoardProxy />
                            <Outlet />
                        </BoardRelationshipController>
                    </AuthGuard>
                }
            >
                <Route path={ROUTES.BOARD.WIKI(":projectUID")} element={<></>} />
                <Route path={ROUTES.BOARD.WIKI_PAGE(":projectUID", ":wikiUID")} element={<></>} />
                <Route path={ROUTES.BOARD.WIKI_ACTIVITY(":projectUID", ":wikiUID")} element={<WikiActivityDialog />} />
                <Route path={ROUTES.BOARD.WIKI_METADATA(":projectUID", ":wikiUID")} element={<WikiMetadataDialog />} />
                <Route path={ROUTES.BOARD.ACTIVITY(":projectUID")} element={<BoardActivityDialog />} />
                <Route path={ROUTES.BOARD.SETTINGS(":projectUID")} element={<></>} />
                <Route path={ROUTES.BOARD.SETTINGS_PAGE(":projectUID", ":page")} element={<></>} />
                <Route path={ROUTES.BOARD.CARD(":projectUID", ":cardUID")} element={<BoardCardPage />} />
            </Route>
        </Route>
    );
}

export default BoardRoute;

import { Navigate, Outlet, RouteObject } from "react-router";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { AuthGuard } from "@/core/routing/AuthGuard";
import { ROUTES } from "@/core/routing/constants";
import BoardProxy from "@/pages/BoardPage";
import BoardCardPage from "@/pages/BoardPage/BoardCardPage";
import { BoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import BoardActivityDialog from "@/pages/BoardPage/components/board/BoardActivityDialog";
import WikiActivityDialog from "@/pages/BoardPage/components/wiki/WikiActivityDialog";
import WikiMetadataDialog from "@/pages/BoardPage/components/wiki/WikiMetadataDialog";
import BoardInvitationPage from "@/pages/BoardPage/BoardInvitationPage";

const routes: RouteObject[] = [
    {
        path: ROUTES.BOARD.ROUTE,
        children: [
            {
                index: true,
                element: <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />,
            },
        ],
    },
    {
        path: ROUTES.BOARD.MAIN(":projectUID"),
        element: (
            <AuthGuard>
                <BoardRelationshipController>
                    <BoardProxy />
                    <Outlet />
                </BoardRelationshipController>
            </AuthGuard>
        ),
        children: [
            {
                path: ROUTES.BOARD.WIKI(":projectUID"),
                element: <></>,
            },
            {
                path: ROUTES.BOARD.WIKI_PAGE(":projectUID", ":wikiUID"),
                element: <></>,
            },
            {
                path: ROUTES.BOARD.WIKI_ACTIVITY(":projectUID", ":wikiUID"),
                element: <WikiActivityDialog />,
            },
            {
                path: ROUTES.BOARD.WIKI_METADATA(":projectUID", ":wikiUID"),
                element: <WikiMetadataDialog />,
            },
            {
                path: ROUTES.BOARD.ACTIVITY(":projectUID"),
                element: <BoardActivityDialog />,
            },
            {
                path: ROUTES.BOARD.SETTINGS(":projectUID"),
                element: <></>,
            },
            {
                path: ROUTES.BOARD.SETTINGS_PAGE(":projectUID", ":page"),
                element: <></>,
            },
            {
                path: ROUTES.BOARD.CARD(":projectUID", ":cardUID"),
                element: <BoardCardPage />,
            },
        ],
    },
    {
        path: ROUTES.BOARD.INVITATION,
        element: (
            <AuthGuard>
                <BoardInvitationPage />
            </AuthGuard>
        ),
    },
];

export default routes;

import { Dialog } from "@/components/base";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useAuth } from "@/core/providers/AuthProvider";
import { useBoardController } from "@/core/providers/BoardController";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCard from "@/pages/BoardPage/components/card/BoardCard";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useRef } from "react";
import { Navigate, useParams } from "react-router";

const BoardCardPage = memo(() => {
    const navigate = usePageNavigateRef();
    const { currentUser } = useAuth();
    const { projectUID, cardUID } = useParams();
    const { selectCardViewType } = useBoardController();
    const viewportRef = useRef<HTMLDivElement | null>(null);

    if (!projectUID || !cardUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const close = () => {
        navigate({
            pathname: ROUTES.BOARD.MAIN(projectUID),
            search: window.location.search,
        });
    };

    return (
        <>
            {currentUser && cardUID && (
                <Dialog.Root open={true} onOpenChange={close}>
                    <Dialog.Content
                        className={cn("max-w-[100vw] px-4 py-4 pb-0 sm:max-w-screen-sm sm:px-6 lg:max-w-screen-md", !!selectCardViewType && "hidden")}
                        aria-describedby=""
                        withCloseButton={false}
                        viewportRef={viewportRef}
                        overlayClassName={selectCardViewType ? "hidden" : ""}
                        disableOverlayClick={!!selectCardViewType}
                    >
                        <BoardCard projectUID={projectUID} cardUID={cardUID} currentUser={currentUser} viewportRef={viewportRef} />
                    </Dialog.Content>
                </Dialog.Root>
            )}
        </>
    );
});

export default BoardCardPage;

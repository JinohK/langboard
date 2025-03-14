import { Dialog } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { useAuth } from "@/core/providers/AuthProvider";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCard from "@/pages/BoardPage/components/card/BoardCard";
import { memo, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const BoardCardPage = memo(() => {
    const navigateRef = useRef(useNavigate());
    const { aboutMe } = useAuth();
    const [projectUID, cardUID] = location.pathname.split("/").slice(2);
    const { selectCardViewType } = useBoardRelationshipController();
    const viewportId = "board-card-dialog";

    if (!projectUID || !cardUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const close = () => {
        navigateRef.current(ROUTES.BOARD.MAIN(projectUID));
    };

    return (
        <>
            {aboutMe() && (
                <Dialog.Root open={!!cardUID} onOpenChange={close}>
                    <Dialog.Content
                        className={cn("max-w-[100vw] px-4 py-4 pb-0 sm:max-w-screen-sm sm:px-6 lg:max-w-screen-md", !!selectCardViewType && "hidden")}
                        aria-describedby=""
                        withCloseButton={false}
                        viewportId={viewportId}
                        overlayClassName={selectCardViewType ? "hidden" : ""}
                        disableOverlayClick={!!selectCardViewType}
                    >
                        {cardUID && <BoardCard projectUID={projectUID} cardUID={cardUID} currentUser={aboutMe()!} viewportId={viewportId} />}
                    </Dialog.Content>
                </Dialog.Root>
            )}
        </>
    );
});

export default BoardCardPage;

import { Dialog } from "@/components/base";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardCard from "@/pages/BoardPage/components/card/BoardCard";
import { memo, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const BoardCardPage = memo(() => {
    const navigate = useRef(useNavigate());
    const { aboutMe } = useAuth();
    const projectUID = location.pathname.split("/")[2];
    const cardUID = location.pathname.split("/")[3];
    const viewportId = "board-card-dialog";

    if (!projectUID || !cardUID) {
        return <Navigate to={ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND)} replace />;
    }

    const close = () => {
        navigate.current(ROUTES.BOARD.MAIN(projectUID));
    };

    return (
        <>
            {aboutMe() && (
                <Dialog.Root open={!!cardUID} onOpenChange={close}>
                    <Dialog.Content
                        className="max-w-[100vw] p-4 pb-0 sm:max-w-screen-sm lg:max-w-screen-md"
                        aria-describedby=""
                        withCloseButton={false}
                        viewportId={viewportId}
                        data-card-dialog-content
                    >
                        {cardUID && <BoardCard projectUID={projectUID} cardUID={cardUID} currentUser={aboutMe()!} viewportId={viewportId} />}
                    </Dialog.Content>
                </Dialog.Root>
            )}
        </>
    );
});

export default BoardCardPage;

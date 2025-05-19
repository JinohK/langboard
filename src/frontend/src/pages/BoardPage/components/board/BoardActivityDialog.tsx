import { Dialog } from "@/components/base";
import { useRef } from "react";
import { ActivityModel } from "@/core/models";
import ActivityList from "@/components/ActivityList";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

function BoardActivityDialog(): JSX.Element | null {
    const navigateRef = useRef(useNavigate());
    const [projectUID] = location.pathname.split("/").slice(2);
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "project" && model.filterable_uid === projectUID);
    const { currentUser } = useAuth();

    const close = () => {
        navigateRef.current(ROUTES.BOARD.MAIN(projectUID));
    };

    if (!currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ type: "project", project_uid: projectUID }}
                    currentUser={currentUser}
                    activities={activities}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}
BoardActivityDialog.displayName = "Board.ActivityDialog";

export default BoardActivityDialog;

import { Dialog } from "@/components/base";
import { useEffect, useRef } from "react";
import { ActivityModel } from "@/core/models";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import ActivityList from "@/components/ActivityList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";

function BoardActivityDialog(): JSX.Element | null {
    const { setIsLoadingRef } = usePageLoader();
    const navigateRef = useRef(useNavigate());
    const [projectUID] = location.pathname.split("/").slice(2);
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "project" && model.filterable_uid === projectUID);
    const { aboutMe } = useAuth();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    const close = () => {
        navigateRef.current(ROUTES.BOARD.MAIN(projectUID));
    };

    if (!aboutMe()) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ type: "project", project_uid: projectUID }}
                    currentUser={aboutMe()!}
                    activities={activities}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BoardActivityDialog;

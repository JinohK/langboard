import { Dialog } from "@/components/base";
import { useEffect, useRef } from "react";
import useGetActivities from "@/controllers/api/activity/useGetActivities";
import { ActivityModel } from "@/core/models";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import ActivityList from "@/components/ActivityList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";

function BoardActivityDialog(): JSX.Element | null {
    const { setIsLoadingRef } = usePageLoader();
    const navigateRef = useRef(useNavigate());
    const [projectUID] = location.pathname.split("/").slice(2);
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "project" && model.filterable_uid === projectUID);

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    const close = () => {
        navigateRef.current(ROUTES.BOARD.MAIN(projectUID));
    };

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-lg" aria-describedby="">
                <ActivityList
                    mutation={() => useGetActivities({ type: "project", project_uid: projectUID })}
                    activities={activities}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BoardActivityDialog;

import { Dialog } from "@/components/base";
import { useEffect, useRef } from "react";
import { ActivityModel } from "@/core/models";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import ActivityList from "@/components/ActivityList";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";
import usePageNavigate from "@/core/hooks/usePageNavigate";

function BoardActivityDialog(): JSX.Element | null {
    const { setIsLoadingRef } = usePageHeader();
    const navigateRef = useRef(usePageNavigate());
    const [projectUID] = location.pathname.split("/").slice(2);
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "project" && model.filterable_uid === projectUID);
    const { aboutMe } = useAuth();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    const close = () => {
        navigateRef.current(ROUTES.BOARD.MAIN(projectUID));
        setTimeout(() => {
            setIsLoadingRef.current(false);
        }, 0);
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

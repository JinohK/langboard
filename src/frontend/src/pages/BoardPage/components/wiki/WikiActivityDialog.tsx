import { Dialog } from "@/components/base";
import { useEffect, useRef } from "react";
import { ActivityModel } from "@/core/models";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import ActivityList from "@/components/ActivityList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";

function WikiActivityDialog(): JSX.Element | null {
    const { setIsLoadingRef } = usePageLoader();
    const navigateRef = useRef(useNavigate());
    const [projectUID, _, wikiUID] = location.pathname.split("/").slice(2);
    const activities = ActivityModel.Model.useModels(
        (model) =>
            model.filterable_type === "project" &&
            model.filterable_uid === projectUID &&
            model.sub_filterable_type === "project_wiki" &&
            model.sub_filterable_uid === wikiUID
    );
    const { aboutMe } = useAuth();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    const close = () => {
        navigateRef.current(ROUTES.BOARD.WIKI_PAGE(projectUID, wikiUID));
    };

    if (!wikiUID || !aboutMe()) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ type: "project_wiki", project_uid: projectUID, wiki_uid: wikiUID }}
                    currentUser={aboutMe()!}
                    activities={activities}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default WikiActivityDialog;

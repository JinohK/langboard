import { Dialog } from "@/components/base";
import { useRef } from "react";
import ActivityList from "@/components/ActivityList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";

function WikiActivityDialog(): JSX.Element | null {
    const navigateRef = useRef(useNavigate());
    const [projectUID, _, wikiUID] = location.pathname.split("/").slice(2);
    const { currentUser } = useAuth();

    const close = () => {
        navigateRef.current(ROUTES.BOARD.WIKI_PAGE(projectUID, wikiUID));
    };

    if (!wikiUID || !currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ listType: "ActivityModel", type: "project_wiki", project_uid: projectUID, wiki_uid: wikiUID }}
                    currentUser={currentUser}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default WikiActivityDialog;

import { Dialog } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { useEffect } from "react";
import { ActivityModel } from "@/core/models";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import ActivityList from "@/components/ActivityList";

export interface IMyActivityDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function MyActivityDialog({ opened, setOpened }: IMyActivityDialogProps): JSX.Element | null {
    const { setIsLoadingRef } = usePageLoader();
    const { aboutMe } = useAuth();
    const currentUser = aboutMe();
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "user");

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, [setOpened]);

    if (!currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ type: "user" }}
                    currentUser={currentUser}
                    activities={activities}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                    isUserView
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default MyActivityDialog;

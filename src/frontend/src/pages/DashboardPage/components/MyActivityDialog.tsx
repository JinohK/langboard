import { Dialog } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { useEffect } from "react";
import useGetActivities from "@/controllers/api/activity/useGetActivities";
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
    const user = aboutMe();
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "user");

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, [setOpened]);

    if (!user) {
        return null;
    }

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-md" aria-describedby="">
                <ActivityList
                    mutation={() => useGetActivities({ type: "user" })}
                    activities={activities}
                    infiniteScrollerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                    isCurrentUser
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default MyActivityDialog;

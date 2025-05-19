import { Dialog } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import { ActivityModel } from "@/core/models";
import ActivityList from "@/components/ActivityList";

export interface IMyActivityDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function MyActivityDialog({ opened, setOpened }: IMyActivityDialogProps): JSX.Element | null {
    const { currentUser } = useAuth();
    const activities = ActivityModel.Model.useModels((model) => model.filterable_type === "user" && model.filterable_uid === currentUser?.uid);

    if (!currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ type: "user", user_uid: currentUser.uid }}
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

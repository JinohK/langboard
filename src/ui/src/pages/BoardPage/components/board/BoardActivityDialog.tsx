import { Dialog } from "@/components/base";
import ActivityList from "@/components/ActivityList";
import { ROUTES } from "@/core/routing/constants";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

function BoardActivityDialog(): JSX.Element | null {
    const navigate = usePageNavigateRef();
    const [projectUID] = location.pathname.split("/").slice(2);
    const redirectTo = location.hash.replace("#", "");
    const { currentUser } = useAuth();

    const close = () => {
        if (redirectTo) {
            navigate(redirectTo);
            return;
        }

        navigate(ROUTES.BOARD.MAIN(projectUID));
    };

    if (!currentUser) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md" aria-describedby="">
                <ActivityList
                    form={{ listType: "ActivityModel", type: "project", project_uid: projectUID }}
                    currentUser={currentUser}
                    outerClassName="max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5"
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}
BoardActivityDialog.displayName = "Board.ActivityDialog";

export default BoardActivityDialog;

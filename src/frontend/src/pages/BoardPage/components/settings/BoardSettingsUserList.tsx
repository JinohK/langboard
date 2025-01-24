import { Flex } from "@/components/base";
import NotificationSetting from "@/components/NotificationSetting";
import { AuthUser } from "@/core/models";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import BoardSettingsSection from "@/pages/BoardPage/components/settings/BoardSettingsSection";
import { memo, useEffect } from "react";

export interface IBoardSettingsUserListProps {
    currentUser: AuthUser.TModel;
    projectUID: string;
}

const BoardSettingsUserList = memo(({ currentUser, projectUID }: IBoardSettingsUserListProps) => {
    const { setIsLoadingRef } = usePageLoader();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <Flex direction="col" gap="3" p={{ initial: "4", md: "6", lg: "8" }} items="center">
            <BoardSettingsSection title="notification.settings.Notification settings">
                <Flex items="center" justify="center" py="4">
                    <NotificationSetting.SpecificScopedPopover
                        type="project"
                        currentUser={currentUser}
                        form={{
                            project_uid: projectUID,
                        }}
                        specificUID={projectUID}
                    />
                </Flex>
            </BoardSettingsSection>
        </Flex>
    );
});

export default BoardSettingsUserList;

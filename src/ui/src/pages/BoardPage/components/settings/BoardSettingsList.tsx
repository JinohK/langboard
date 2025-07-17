import { Flex } from "@/components/base";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsBasic from "@/pages/BoardPage/components/settings/BoardSettingsBasic";
import BoardSettingsOther from "@/pages/BoardPage/components/settings/BoardSettingsOther";
import BoardSettingsSection from "@/pages/BoardPage/components/settings/BoardSettingsSection";
import BoardSettingsChatTemplateList from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateList";
import BoardSettingsInternalBotList from "@/pages/BoardPage/components/settings/internalBots/BoardSettingsInternalBotList";
import BoardSettingsLabelList from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelList";
import BoardSettingsMemberRoleList from "@/pages/BoardPage/components/settings/roles/BoardSettingsMemberRoleList";
import { memo, useMemo } from "react";

export function SkeletonSettingsList() {
    return <></>;
}

const BoardSettingsList = memo(() => {
    const { project, currentUser } = useBoardSettings();
    const ownerUID = project.useField("owner_uid");
    const allMembers = project.useForeignField("all_members");
    const invitedMemberUIDs = project.useField("invited_member_uids");
    const numMembers = useMemo(
        () =>
            allMembers.filter((m) => m.isValidUser() && m.uid !== ownerUID && m.uid !== currentUser.uid && !invitedMemberUIDs.includes(m.uid)).length,
        [allMembers, ownerUID, currentUser, invitedMemberUIDs]
    );

    return (
        <Flex direction="col" gap="3" p={{ initial: "4", md: "6", lg: "8" }} items="center">
            <BoardSettingsSection title="project.settings.Basic info">
                <BoardSettingsBasic />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Internal bots">
                <BoardSettingsInternalBotList key={`board-settings-internal-bots-${project.uid}`} />
            </BoardSettingsSection>
            {numMembers > 0 && (
                <BoardSettingsSection title="project.settings.Member roles">
                    <BoardSettingsMemberRoleList key={`board-settings-member-roles-${project.uid}`} />
                </BoardSettingsSection>
            )}
            <BoardSettingsSection title="project.settings.Label">
                <BoardSettingsLabelList />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Chat templates">
                <BoardSettingsChatTemplateList key={`board-settings-chat-templates-${project.uid}`} />
            </BoardSettingsSection>
            {currentUser.is_admin || project.owner_uid === currentUser.uid ? (
                <BoardSettingsSection title="common.Other">
                    <BoardSettingsOther />
                </BoardSettingsSection>
            ) : null}
        </Flex>
    );
});

export default BoardSettingsList;

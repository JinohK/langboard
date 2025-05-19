import { Flex } from "@/components/base";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsBasic from "@/pages/BoardPage/components/settings/BoardSettingsBasic";
import BoardSettingsBots from "@/pages/BoardPage/components/settings/BoardSettingsBots";
import BoardSettingsOther from "@/pages/BoardPage/components/settings/BoardSettingsOther";
import BoardSettingsSection from "@/pages/BoardPage/components/settings/BoardSettingsSection";
import BoardSettingsCronBotList from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotList";
import BoardSettingsLabelList from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelList";
import BoardSettingsBotRoleList from "@/pages/BoardPage/components/settings/roles/BoardSettingsBotRoleList";
import BoardSettingsMemberRoleList from "@/pages/BoardPage/components/settings/roles/BoardSettingsMemberRoleList";
import { memo } from "react";

export function SkeletonSettingsList() {
    return <></>;
}

const BoardSettingsList = memo(() => {
    const { project, currentUser } = useBoardSettings();

    return (
        <Flex direction="col" gap="3" p={{ initial: "4", md: "6", lg: "8" }} items="center">
            <BoardSettingsSection title="project.settings.Basic info">
                <BoardSettingsBasic />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Bots">
                <BoardSettingsBots key={`board-settings-bots-${project.uid}`} />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Bot roles">
                <BoardSettingsBotRoleList key={`board-settings-bot-roles-${project.uid}`} />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Member roles">
                <BoardSettingsMemberRoleList key={`board-settings-member-roles-${project.uid}`} />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Bot schedules">
                <BoardSettingsCronBotList key={`board-settings-bot-schedules-${project.uid}`} />
            </BoardSettingsSection>
            <BoardSettingsSection title="project.settings.Label">
                <BoardSettingsLabelList />
            </BoardSettingsSection>
            {currentUser.is_admin || project.owner.uid === currentUser.uid ? (
                <BoardSettingsSection title="project.settings.Other">
                    <BoardSettingsOther />
                </BoardSettingsSection>
            ) : null}
        </Flex>
    );
});

export default BoardSettingsList;

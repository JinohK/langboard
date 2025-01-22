import { Flex } from "@/components/base";
import { User } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsRole from "@/pages/BoardPage/components/settings/roles/BoardSEttingsRole";
import { memo, useState } from "react";

const BoardSettingsRoleList = memo(() => {
    const { project } = useBoardSettings();
    const [isValidating, setIsValidating] = useState(false);
    const memberRoles = project.useField("member_roles");
    const members = User.Model.useModels((model) => !!memberRoles[model.uid] && model.uid !== project.owner.uid);

    return (
        <Flex direction="col" gap="2" py="4">
            {members.map((member) => (
                <BoardSettingsRole member={member} isValidating={isValidating} setIsValidating={setIsValidating} key={member.uid} />
            ))}
        </Flex>
    );
});

export default BoardSettingsRoleList;

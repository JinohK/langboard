import { Flex } from "@/components/base";
import { User } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsMemberRole from "@/pages/BoardPage/components/settings/roles/BoardSettingsMemberRole";
import { memo, useRef, useState } from "react";

const BoardSettingsMemberRoleList = memo(() => {
    const { project } = useBoardSettings();
    const [isValidating, setIsValidating] = useState(false);
    const isValidatingRef = useRef(isValidating);
    const memberRoles = project.useField("member_roles");
    const members = User.Model.useModels((model) => !!memberRoles[model.uid] && model.uid !== project.owner.uid, [memberRoles]);

    return (
        <Flex direction="col" gap="2" py="4">
            {members.map((member) => (
                <BoardSettingsMemberRole
                    member={member}
                    isValidating={isValidating}
                    setIsValidating={setIsValidating}
                    isValidatingRef={isValidatingRef}
                    key={member.uid}
                />
            ))}
        </Flex>
    );
});

export default BoardSettingsMemberRoleList;

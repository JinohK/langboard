import { Flex } from "@/components/base";
import { BotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsBotRole from "@/pages/BoardPage/components/settings/roles/BoardSettingsBotRole";
import { memo, useRef, useState } from "react";

const BoardSettingsBotRoleList = memo(() => {
    const { project } = useBoardSettings();
    const [isValidating, setIsValidating] = useState(false);
    const isValidatingRef = useRef(isValidating);
    const botRoles = project.useField("bot_roles");
    const bots = BotModel.Model.useModels((model) => !!botRoles[model.uid], [botRoles]);

    return (
        <Flex direction="col" gap="2" py="4">
            {bots.map((bot) => (
                <BoardSettingsBotRole
                    bot={bot}
                    isValidating={isValidating}
                    setIsValidating={setIsValidating}
                    isValidatingRef={isValidatingRef}
                    key={bot.uid}
                />
            ))}
        </Flex>
    );
});

export default BoardSettingsBotRoleList;

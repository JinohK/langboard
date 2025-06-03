import { Flex } from "@/components/base";
import { ChatTemplateModel } from "@/core/models";
import BoardSettingsChatTemplateMore from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateMore";
import { memo } from "react";

interface IBoardSettingsChatTemplatetProps {
    chatTemplate: ChatTemplateModel.TModel;
}

const BoardSettingsChatTemplate = memo(({ chatTemplate }: IBoardSettingsChatTemplatetProps) => {
    const name = chatTemplate.useField("name");

    return (
        <Flex items="center" justify="between" gap="3">
            <span className="truncate">{name}</span>
            <BoardSettingsChatTemplateMore chatTemplate={chatTemplate} />
        </Flex>
    );
});

export default BoardSettingsChatTemplate;

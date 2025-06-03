import { ChatTemplateModel } from "@/core/models";

export interface IBoardSettingsChatTemplateRelatedProps {
    chatTemplate: ChatTemplateModel.TModel;
    setIsMoreMenuOpened: (value: bool) => void;
}

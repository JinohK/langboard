import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatTemplateModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardChatTemplateUpdatedRawResponse {
    name?: string;
    template?: string;
}

export interface IUseBoardChatTemplateUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    template: ChatTemplateModel.TModel;
}

const useBoardChatTemplateUpdatedHandlers = ({ callback, projectUID, template }: IUseBoardChatTemplateUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardChatTemplateUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-template-updated-${template.uid}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CHAT.TEMPLATE.UPDATED,
            params: { uid: template.uid },
            callback,
            responseConverter: (data) => {
                if (data.name) {
                    template.name = data.name;
                }
                if (data.template) {
                    template.template = data.template;
                }
                return {};
            },
        },
    });
};

export default useBoardChatTemplateUpdatedHandlers;

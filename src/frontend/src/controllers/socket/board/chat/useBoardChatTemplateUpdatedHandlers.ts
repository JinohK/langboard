import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatTemplateModel } from "@/core/models";

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
        eventKey: `board-card-template-updated-${template.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT.TEMPLATE.UPDATED,
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

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatTemplateModel } from "@/core/models";

export interface IBoardChatTemplateCreatedRawResponse {
    template: ChatTemplateModel.Interface;
}

export interface IUseBoardChatTemplateCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardChatTemplateCreatedHandlers = ({ callback, projectUID }: IUseBoardChatTemplateCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardChatTemplateCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-template-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT.TEMPLATE.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ChatTemplateModel.Model.fromObject(data.template, true);
                return {};
            },
        },
    });
};

export default useBoardChatTemplateCreatedHandlers;

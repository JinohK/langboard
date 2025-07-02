import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatTemplateModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardChatTemplateDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    template: ChatTemplateModel.TModel;
}

const useBoardChatTemplateDeletedHandlers = ({ callback, projectUID, template }: IUseBoardChatTemplateDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-template-updated-${template.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT.TEMPLATE.DELETED,
            params: { uid: template.uid },
            callback,
            responseConverter: () => {
                ChatTemplateModel.Model.deleteModel(template.uid);
                return {};
            },
        },
    });
};

export default useBoardChatTemplateDeletedHandlers;

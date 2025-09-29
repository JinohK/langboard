import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatTemplateModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.CHAT.TEMPLATE.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ChatTemplateModel.Model.fromOne(data.template, true);
                return {};
            },
        },
    });
};

export default useBoardChatTemplateCreatedHandlers;

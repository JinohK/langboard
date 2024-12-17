import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { IEditorContent } from "@/core/models/Base";

export interface ICardDescriptionChangedRequest {}

export interface ICardDescriptionChangedResponse {
    description: IEditorContent;
}

export interface IUseCardDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardDescriptionChangedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardDescriptionChangedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardDescriptionChangedHandlersProps) => {
    return useSocketHandler<ICardDescriptionChangedRequest, ICardDescriptionChangedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-description-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DESCRIPTION_CHANGED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardDescriptionChangedHandlers;

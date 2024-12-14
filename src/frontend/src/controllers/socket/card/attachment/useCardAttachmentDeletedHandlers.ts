import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardAttachmentDeletedRequest {}

export interface ICardAttachmentDeletedResponse {
    uid: string;
}

export interface IUseCardAttachmentDeletedHandlersProps extends IBaseUseSocketHandlersProps<ICardAttachmentDeletedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardAttachmentDeletedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardAttachmentDeletedHandlersProps) => {
    return useSocketHandler<ICardAttachmentDeletedRequest, ICardAttachmentDeletedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-attachment-deleted-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.DELETED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardAttachmentDeletedHandlers;

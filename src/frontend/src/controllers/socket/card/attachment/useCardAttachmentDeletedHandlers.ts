import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardAttachmentDeletedRequest {
    card_uid: string;
    attachment_uid: string;
}

export interface ICardAttachmentDeletedResponse {
    uid: string;
}

export interface IUseCardAttachmentDeletedHandlersProps extends IBaseUseSocketHandlersProps<ICardAttachmentDeletedResponse> {
    cardUID?: string;
}

const useCardAttachmentDeletedHandlers = ({ socket, callback, cardUID }: IUseCardAttachmentDeletedHandlersProps) => {
    return useSocketHandler<ICardAttachmentDeletedRequest, ICardAttachmentDeletedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.DELETED,
            params: cardUID ? { uid: cardUID } : undefined,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.ATTACHMENT.DELETED,
        },
    });
};

export default useCardAttachmentDeletedHandlers;

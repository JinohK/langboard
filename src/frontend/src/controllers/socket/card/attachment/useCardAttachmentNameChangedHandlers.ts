import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardAttachmentNameChangedRequest extends IModelIdBase {}

export interface ICardAttachmentNameChangedResponse {
    name: string;
}

export interface IUseCardAttachmentNameChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardAttachmentNameChangedResponse> {
    attachmentUID?: string;
}

const useCardAttachmentNameChangedHandlers = ({ socket, callback, attachmentUID }: IUseCardAttachmentNameChangedHandlersProps) => {
    return useSocketHandler<ICardAttachmentNameChangedRequest, ICardAttachmentNameChangedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.NAME_CHANGED,
            params: attachmentUID ? { uid: attachmentUID } : undefined,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.ATTACHMENT.NAME_CHANGED,
        },
    });
};

export default useCardAttachmentNameChangedHandlers;

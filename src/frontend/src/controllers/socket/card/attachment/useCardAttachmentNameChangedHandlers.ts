import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardAttachmentNameChangedRequest {}

export interface ICardAttachmentNameChangedResponse {
    name: string;
}

export interface IUseCardAttachmentNameChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardAttachmentNameChangedResponse> {
    projectUID: string;
    attachmentUID: string;
}

const useCardAttachmentNameChangedHandlers = ({ socket, callback, projectUID, attachmentUID }: IUseCardAttachmentNameChangedHandlersProps) => {
    return useSocketHandler<ICardAttachmentNameChangedRequest, ICardAttachmentNameChangedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-attachment-name-changed-${attachmentUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.NAME_CHANGED,
            params: { uid: attachmentUID },
            callback,
        },
    });
};

export default useCardAttachmentNameChangedHandlers;

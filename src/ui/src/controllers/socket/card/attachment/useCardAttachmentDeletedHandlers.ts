import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardAttachmentDeletedRawResponse {
    uid: string;
}

export interface IUseCardAttachmentDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
}

const useCardAttachmentDeletedHandlers = ({ callback, cardUID }: IUseCardAttachmentDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardAttachmentDeletedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-attachment-deleted-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.DELETED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                ProjectCardAttachment.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useCardAttachmentDeletedHandlers;

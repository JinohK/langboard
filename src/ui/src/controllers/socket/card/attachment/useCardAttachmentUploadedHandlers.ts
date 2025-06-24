import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment } from "@/core/models";

export interface ICardAttachmentUploadedRawResponse {
    attachment: ProjectCardAttachment.IStore;
}

export interface IUseCardAttachmentUploadedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
}

const useCardAttachmentUploadedHandlers = ({ callback, cardUID }: IUseCardAttachmentUploadedHandlersProps) => {
    return useSocketHandler<{}, ICardAttachmentUploadedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-attachment-uploaded-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.UPLOADED,
            params: cardUID ? { uid: cardUID } : undefined,
            callback,
            responseConverter: (data) => {
                ProjectCardAttachment.Model.fromOne(data.attachment, true);
                return {};
            },
        },
    });
};

export default useCardAttachmentUploadedHandlers;

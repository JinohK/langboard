import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.CARD.ATTACHMENT.UPLOADED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                ProjectCardAttachment.Model.fromOne(data.attachment, true);
                return {};
            },
        },
    });
};

export default useCardAttachmentUploadedHandlers;

import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardAttachmentNameChangedRawResponse {
    name: string;
}

export interface IUseCardAttachmentNameChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    attachmentUID: string;
}

const useCardAttachmentNameChangedHandlers = ({ callback, cardUID, attachmentUID }: IUseCardAttachmentNameChangedHandlersProps) => {
    return useSocketHandler<{}, ICardAttachmentNameChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-attachment-name-changed-${attachmentUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CARD.ATTACHMENT.NAME_CHANGED,
            params: { uid: attachmentUID },
            callback,
            responseConverter: (data) => {
                const attachment = ProjectCardAttachment.Model.getModel(attachmentUID);
                if (attachment) {
                    attachment.name = data.name;
                }
                return {};
            },
        },
    });
};

export default useCardAttachmentNameChangedHandlers;

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment, User } from "@/core/models";

export interface ICardAttachmentUploadedRequest {}

export interface ICardAttachmentUploadedResponse {
    attachment: ProjectCardAttachment.IBoard;
}

export interface IUseCardAttachmentUploadedHandlersProps extends IBaseUseSocketHandlersProps<ICardAttachmentUploadedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardAttachmentUploadedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardAttachmentUploadedHandlersProps) => {
    return useSocketHandler<ICardAttachmentUploadedRequest, ICardAttachmentUploadedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-attachment-uploaded-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.UPLOADED,
            params: cardUID ? { uid: cardUID } : undefined,
            callback,
            responseConverter: (response) => {
                ProjectCardAttachment.transformFromApi(response.attachment);
                User.transformFromApi(response.attachment.user);
                return response;
            },
        },
    });
};

export default useCardAttachmentUploadedHandlers;

import { IBoardCardAttachment } from "@/controllers/api/card/useGetCardDetails";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment, User } from "@/core/models";

export interface ICardAttachmentUploadedRequest {
    card_uid: string;
    attachment_uid: string;
    attachment: IBoardCardAttachment;
}

export interface ICardAttachmentUploadedResponse {
    attachment: IBoardCardAttachment;
}

export interface IUseCardAttachmentUploadedHandlersProps extends IBaseUseSocketHandlersProps<ICardAttachmentUploadedResponse> {
    cardUID?: string;
}

const useCardAttachmentUploadedHandlers = ({ socket, callback, cardUID }: IUseCardAttachmentUploadedHandlersProps) => {
    return useSocketHandler<ICardAttachmentUploadedRequest, ICardAttachmentUploadedResponse>({
        socket,
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
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.ATTACHMENT.UPLOADED,
        },
    });
};

export default useCardAttachmentUploadedHandlers;

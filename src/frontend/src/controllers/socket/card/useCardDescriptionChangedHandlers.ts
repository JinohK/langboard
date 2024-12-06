import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { IEditorContent } from "@/core/models/Base";

export interface ICardDescriptionChangedRequest extends IModelIdBase {}

export interface ICardDescriptionChangedResponse {
    description: IEditorContent;
}

export interface IUseCardDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardDescriptionChangedResponse> {
    cardUID: string;
}

const useCardDescriptionChangedHandlers = ({ socket, callback, cardUID }: IUseCardDescriptionChangedHandlersProps) => {
    return useSocketHandler<ICardDescriptionChangedRequest, ICardDescriptionChangedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DESCRIPTION_CHANGED,
            params: { uid: cardUID },
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.DETAILS_CHANGED,
        },
    });
};

export default useCardDescriptionChangedHandlers;

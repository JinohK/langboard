import { IBoardCard } from "@/controllers/api/board/useGetCards";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardCardCreatedRequest {
    card: IBoardCard;
}

export interface IBoardCardCreatedResponse {
    card: IBoardCard;
}

export interface IUseBoardCardCreatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardCardCreatedResponse> {
    columnUID?: string;
}

const useBoardCardCreatedHandlers = ({ socket, callback, columnUID }: IUseBoardCardCreatedHandlersProps) => {
    return useSocketHandler<IBoardCardCreatedRequest, IBoardCardCreatedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CREATED,
            params: columnUID ? { uid: columnUID } : undefined,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CREATED,
        },
    });
};

export default useBoardCardCreatedHandlers;

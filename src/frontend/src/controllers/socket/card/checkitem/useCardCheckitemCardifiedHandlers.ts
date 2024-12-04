import { IBoardCard } from "@/controllers/api/board/useGetCards";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";

export interface ICardCheckitemCardifiedRequest {
    checkitem_uid: string;
    new_card: IBoardCard;
}

export interface ICardCheckitemCardifiedResponse {
    new_card: IBoardCard;
}

export interface IUseCardCheckitemCardifiedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemCardifiedResponse> {
    checkitemUID?: string;
}

const useCardCheckitemCardifiedHandlers = ({ socket, callback, checkitemUID }: IUseCardCheckitemCardifiedHandlersProps) => {
    return useSocketHandler<ICardCheckitemCardifiedRequest, ICardCheckitemCardifiedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CARDIFIED,
            params: checkitemUID ? { uid: checkitemUID } : undefined,
            callback,
            responseConverter: (response) => {
                User.transformFromApi(response.new_card.members);
                return response;
            },
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.CARDIFIED,
        },
    });
};

export default useCardCheckitemCardifiedHandlers;

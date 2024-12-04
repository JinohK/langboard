import { IBoardCardCheckitem } from "@/controllers/api/card/useGetCardDetails";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitemTimer, User } from "@/core/models";

export interface ICardCheckitemCreatedRequest {
    card_uid: string;
    checkitem: IBoardCardCheckitem;
}

export interface ICardCheckitemCreatedResponse {
    checkitem: IBoardCardCheckitem;
}

export interface IUseCardCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemCreatedResponse> {
    cardUID?: string;
}

const useCardCheckitemCreatedHandlers = ({ socket, callback, cardUID }: IUseCardCheckitemCreatedHandlersProps) => {
    return useSocketHandler<ICardCheckitemCreatedRequest, ICardCheckitemCreatedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CREATED,
            params: cardUID ? { uid: cardUID } : undefined,
            callback,
            responseConverter: (response) => {
                response.checkitem.timer = ProjectCheckitemTimer.transformFromApi(response.checkitem.timer);
                response.checkitem.assigned_members = User.transformFromApi(response.checkitem.assigned_members);
                for (let i = 0; i < response.checkitem.sub_checkitems.length; ++i) {
                    response.checkitem.sub_checkitems[i].timer = ProjectCheckitemTimer.transformFromApi(response.checkitem.sub_checkitems[i].timer);
                    response.checkitem.sub_checkitems[i].assigned_members = User.transformFromApi(
                        response.checkitem.sub_checkitems[i].assigned_members
                    );
                }

                return response;
            },
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.CREATED,
        },
    });
};

export default useCardCheckitemCreatedHandlers;

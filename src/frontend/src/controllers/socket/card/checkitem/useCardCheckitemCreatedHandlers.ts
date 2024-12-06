import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";

export interface ICardCheckitemCreatedRequest extends IModelIdBase {}

export interface ICardCheckitemCreatedResponse {
    checkitem: ProjectCheckitem.IBoard;
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
                    const subCheckitem = response.checkitem.sub_checkitems[i];
                    subCheckitem.timer = ProjectCheckitemTimer.transformFromApi(subCheckitem.timer);
                    subCheckitem.assigned_members = User.transformFromApi(subCheckitem.assigned_members);
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

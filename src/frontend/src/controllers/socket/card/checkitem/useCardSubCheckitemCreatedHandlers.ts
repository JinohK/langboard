import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";

export interface ICardSubCheckitemCreatedRequest extends IModelIdBase {}

export interface ICardSubCheckitemCreatedResponse {
    checkitem: ProjectCheckitem.IBoardSub;
}

export interface IUseCardSubCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<ICardSubCheckitemCreatedResponse> {
    checkitemUID?: string;
}

const useCardSubCheckitemCreatedHandlers = ({ socket, callback, checkitemUID }: IUseCardSubCheckitemCreatedHandlersProps) => {
    return useSocketHandler<ICardSubCheckitemCreatedRequest, ICardSubCheckitemCreatedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.SUB_CHECKITEM.CREATED,
            params: checkitemUID ? { uid: checkitemUID } : undefined,
            callback,
            responseConverter: (response) => ({
                checkitem: {
                    ...response.checkitem,
                    assigned_members: User.transformFromApi(response.checkitem.assigned_members),
                    timer: ProjectCheckitemTimer.transformFromApi(response.checkitem.timer),
                },
            }),
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.SUB_CHECKITEM.CREATED,
        },
    });
};

export default useCardSubCheckitemCreatedHandlers;

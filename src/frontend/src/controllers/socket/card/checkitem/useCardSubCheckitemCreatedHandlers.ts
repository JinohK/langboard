import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";

export interface ICardSubCheckitemCreatedRequest {}

export interface ICardSubCheckitemCreatedResponse {
    checkitem: ProjectCheckitem.IBoardSub;
}

export interface IUseCardSubCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<ICardSubCheckitemCreatedResponse> {
    projectUID: string;
    checkitemUID: string;
}

const useCardSubCheckitemCreatedHandlers = ({ socket, callback, projectUID, checkitemUID }: IUseCardSubCheckitemCreatedHandlersProps) => {
    return useSocketHandler<ICardSubCheckitemCreatedRequest, ICardSubCheckitemCreatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-sub-checkitem-created-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.SUB_CHECKITEM.CREATED,
            params: { uid: checkitemUID },
            callback,
            responseConverter: (response) => ({
                checkitem: {
                    ...response.checkitem,
                    assigned_members: User.transformFromApi(response.checkitem.assigned_members),
                    timer: ProjectCheckitemTimer.transformFromApi(response.checkitem.timer),
                },
            }),
        },
    });
};

export default useCardSubCheckitemCreatedHandlers;

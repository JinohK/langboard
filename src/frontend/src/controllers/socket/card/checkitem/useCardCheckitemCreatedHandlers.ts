import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, ProjectCheckitemTimer, User } from "@/core/models";

export interface ICardCheckitemCreatedRequest {}

export interface ICardCheckitemCreatedResponse {
    checkitem: ProjectCheckitem.IBoard;
}

export interface IUseCardCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemCreatedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardCheckitemCreatedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardCheckitemCreatedHandlersProps) => {
    return useSocketHandler<ICardCheckitemCreatedRequest, ICardCheckitemCreatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-checkitem-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CREATED,
            params: { uid: cardUID },
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
    });
};

export default useCardCheckitemCreatedHandlers;

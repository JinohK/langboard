import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, User } from "@/core/models";

export interface IBoardCardCreatedRequest {}

export interface IBoardCardCreatedResponse {
    card: ProjectCard.IBoard;
}

export interface IUseBoardCardCreatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardCardCreatedResponse> {
    projectUID: string;
    columnUID: string;
}

const useBoardCardCreatedHandlers = ({ socket, callback, projectUID, columnUID }: IUseBoardCardCreatedHandlersProps) => {
    return useSocketHandler<IBoardCardCreatedRequest, IBoardCardCreatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-created-${columnUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CREATED,
            params: { uid: columnUID },
            callback,
            responseConverter: (data) => {
                User.transformFromApi(data.card.members);
                return data;
            },
        },
    });
};

export default useBoardCardCreatedHandlers;

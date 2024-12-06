import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, User } from "@/core/models";

export interface IBoardCardCreatedRequest extends IModelIdBase {}

export interface IBoardCardCreatedResponse {
    card: ProjectCard.IBoard;
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
            responseConverter: (data) => {
                User.transformFromApi(data.card.members);
                return data;
            },
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CREATED,
        },
    });
};

export default useBoardCardCreatedHandlers;

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardWikiDeletedResponse {
    uid: string;
}

export interface IUseBoardWikiDeletedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiDeletedResponse> {
    projectUID: string;
}

const useBoardWikiDeletedHandlers = ({ socket, callback, projectUID }: IUseBoardWikiDeletedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                return data;
            },
        },
    });
};

export default useBoardWikiDeletedHandlers;

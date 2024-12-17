import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki, User } from "@/core/models";

export interface IBoardWikiCreatedRequest {}

export interface IBoardWikiCreatedResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiCreatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiCreatedResponse> {
    projectUID: string;
    username?: string;
}

const useBoardWikiCreatedHandlers = ({ socket, callback, projectUID, username }: IUseBoardWikiCreatedHandlersProps) => {
    const topic = username ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = username ?? projectUID;

    return useSocketHandler<IBoardWikiCreatedRequest, IBoardWikiCreatedResponse>({
        socket,
        topic,
        topicId,
        eventKey: `board-wiki-created-${topic}-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                User.transformFromApi(data.wiki.assigned_members);
                return data;
            },
        },
    });
};

export default useBoardWikiCreatedHandlers;

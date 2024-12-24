import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki, User } from "@/core/models";

export interface IBoardWikiCreatedResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiCreatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiCreatedResponse> {
    projectUID: string;
    userUID?: string;
}

const useBoardWikiCreatedHandlers = ({ socket, callback, projectUID, userUID }: IUseBoardWikiCreatedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler({
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

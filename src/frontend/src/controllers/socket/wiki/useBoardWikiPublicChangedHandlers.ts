import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki, User } from "@/core/models";

export interface IBoardWikiPublicChangedResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiPublicChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiPublicChangedResponse> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiPublicChangedHandlers = ({ socket, callback, projectUID, wikiUID, userUID }: IUseBoardWikiPublicChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler({
        socket,
        topic,
        topicId,
        eventKey: `board-wiki-public-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.PUBLIC_CHANGED,
            params: { uid: wikiUID },
            callback,
            responseConverter: (data) => {
                User.transformFromApi(data.wiki.assigned_members);
                return data;
            },
        },
    });
};

export default useBoardWikiPublicChangedHandlers;

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardWikiTitleChangedRequest {}

export interface IBoardWikiTitleChangedResponse {
    title: string;
}

export interface IUseBoardWikiTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiTitleChangedResponse> {
    projectUID: string;
    wikiUID: string;
    username?: string;
}

const useBoardWikiTitleChangedHandlers = ({ socket, callback, projectUID, wikiUID, username }: IUseBoardWikiTitleChangedHandlersProps) => {
    const topic = username ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = username ?? projectUID;

    return useSocketHandler<IBoardWikiTitleChangedRequest, IBoardWikiTitleChangedResponse>({
        socket,
        topic,
        topicId,
        eventKey: `board-wiki-title-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.TITLE_CHANGED,
            params: { uid: wikiUID },
            callback,
        },
    });
};

export default useBoardWikiTitleChangedHandlers;

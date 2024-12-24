import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardWikiTitleChangedResponse {
    title: string;
}

export interface IUseBoardWikiTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiTitleChangedResponse> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiTitleChangedHandlers = ({ socket, callback, projectUID, wikiUID, userUID }: IUseBoardWikiTitleChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler({
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

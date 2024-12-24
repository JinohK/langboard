import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { IEditorContent } from "@/core/models/Base";

export interface IBoardWikiContentChangedResponse {
    content: IEditorContent;
}

export interface IUseBoardWikiContentChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiContentChangedResponse> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiContentChangedHandlers = ({ socket, callback, projectUID, wikiUID, userUID }: IUseBoardWikiContentChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler({
        socket,
        topic,
        topicId,
        eventKey: `board-wiki-title-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.CONTENT_CHANGED,
            params: { uid: wikiUID },
            callback,
        },
    });
};

export default useBoardWikiContentChangedHandlers;

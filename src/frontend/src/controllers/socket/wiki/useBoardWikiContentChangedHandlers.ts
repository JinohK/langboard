import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";

export interface IBoardWikiContentChangedRawResponse {
    content: IEditorContent;
}

export interface IUseBoardWikiContentChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiContentChangedHandlers = ({ callback, projectUID, wikiUID, userUID }: IUseBoardWikiContentChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler<{}, IBoardWikiContentChangedRawResponse>({
        topic,
        topicId,
        eventKey: `board-wiki-title-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.CONTENT_CHANGED,
            params: { uid: wikiUID },
            callback,
            responseConverter: (data) => {
                const wiki = ProjectWiki.Model.getModel(wikiUID);
                if (wiki) {
                    wiki.content = data.content;
                }
                return {};
            },
        },
    });
};

export default useBoardWikiContentChangedHandlers;

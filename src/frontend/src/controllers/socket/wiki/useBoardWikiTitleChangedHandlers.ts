import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";

export interface IBoardWikiTitleChangedRawResponse {
    title: string;
}

export interface IUseBoardWikiTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiTitleChangedHandlers = ({ callback, projectUID, wikiUID, userUID }: IUseBoardWikiTitleChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler<{}, IBoardWikiTitleChangedRawResponse>({
        topic,
        topicId,
        eventKey: `board-wiki-title-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.TITLE_CHANGED,
            params: { uid: wikiUID },
            callback,
            responseConverter: (data) => {
                const wiki = ProjectWiki.Model.getModel(wikiUID);
                if (wiki) {
                    wiki.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useBoardWikiTitleChangedHandlers;

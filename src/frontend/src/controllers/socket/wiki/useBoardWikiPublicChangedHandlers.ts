import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";

export interface IBoardWikiPublicChangedResponse {
    wiki: ProjectWiki.TModel;
}

export interface IBoardWikiPublicChangedRawResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiPublicChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiPublicChangedResponse> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiPublicChangedHandlers = ({ callback, projectUID, wikiUID, userUID }: IUseBoardWikiPublicChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler<IBoardWikiPublicChangedResponse, IBoardWikiPublicChangedRawResponse>({
        topic,
        topicId,
        eventKey: `board-wiki-public-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.PUBLIC_CHANGED,
            params: { uid: wikiUID },
            callback,
            responseConverter: (data) => {
                return {
                    wiki: ProjectWiki.Model.fromObject(data.wiki),
                };
            },
        },
    });
};

export default useBoardWikiPublicChangedHandlers;

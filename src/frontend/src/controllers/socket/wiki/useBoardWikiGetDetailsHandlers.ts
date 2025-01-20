import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";

export interface IBoardWikiGetDetailsRawResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiGetDetailsHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    wiki: ProjectWiki.TModel;
}

const useBoardWikiGetDetailsHandlers = ({ callback, wiki }: IUseBoardWikiGetDetailsHandlersProps) => {
    return useSocketHandler<{}, IBoardWikiGetDetailsRawResponse>({
        topic: ESocketTopic.BoardWikiPrivate,
        topicId: wiki.uid,
        eventKey: `board-wiki-get-details-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.GOT_DETAILS,
            params: { uid: wiki.uid },
            callback,
            responseConverter: (data) => {
                ProjectWiki.Model.fromObject({ ...data.wiki }, true);
                return {};
            },
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.WIKI.GET_DETAILS,
        },
    });
};

export default useBoardWikiGetDetailsHandlers;

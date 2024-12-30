import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";

export interface IBoardWikiCreatedRawResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    userUID?: string;
}

const useBoardWikiCreatedHandlers = ({ callback, projectUID, userUID }: IUseBoardWikiCreatedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler<{}, IBoardWikiCreatedRawResponse>({
        topic,
        topicId,
        eventKey: `board-wiki-created-${topic}-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectWiki.Model.fromObject(data.wiki);
                return {};
            },
        },
    });
};

export default useBoardWikiCreatedHandlers;

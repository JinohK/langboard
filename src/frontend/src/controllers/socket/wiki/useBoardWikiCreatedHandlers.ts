import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";

export interface IBoardWikiCreatedRawResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardWikiCreatedHandlers = ({ callback, projectUID }: IUseBoardWikiCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardWikiCreatedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-created-${projectUID}`,
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

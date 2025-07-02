import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardWikiDeletedRawResponse {
    uid: string;
}

export interface IUseBoardWikiDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardWikiDeletedHandlers = ({ callback, projectUID }: IUseBoardWikiDeletedHandlersProps) => {
    return useSocketHandler<{}, IBoardWikiDeletedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectWiki.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useBoardWikiDeletedHandlers;

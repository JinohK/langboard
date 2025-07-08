import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardWikiDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wiki: ProjectWiki.TModel;
}

const useBoardWikiDeletedHandlers = ({ callback, projectUID, wiki }: IUseBoardWikiDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-deleted-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.DELETED,
            params: { uid: wiki.uid },
            callback,
            responseConverter: () => {
                ProjectWiki.Model.deleteModel(wiki.uid);
                return {};
            },
        },
    });
};

export default useBoardWikiDeletedHandlers;

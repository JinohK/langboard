import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardUIWikiDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wiki: ProjectWiki.TModel;
}

const useBoardUIWikiDeletedHandlers = ({ callback, projectUID, wiki }: IUseBoardUIWikiDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-ui-wiki-deleted-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.DELETED,
            params: { uid: wiki.uid },
            callback,
        },
    });
};

export default useBoardUIWikiDeletedHandlers;

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";

export interface IBoardWikiDetailsChangedRawResponse {
    title?: string;
    content?: IEditorContent;
}

export interface IUseBoardWikiDetailsChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wiki: ProjectWiki.TModel;
    isPrivate: bool;
}

const useBoardWikiDetailsChangedHandlers = ({ callback, projectUID, wiki, isPrivate }: IUseBoardWikiDetailsChangedHandlersProps) => {
    const topic = isPrivate ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = isPrivate ? wiki.uid : projectUID;

    return useSocketHandler<{}, IBoardWikiDetailsChangedRawResponse>({
        topic,
        topicId,
        eventKey: `board-wiki-details-changed-${topic}-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.DETAILS_CHANGED,
            params: { uid: wiki.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    wiki[key] = value as string & IEditorContent;
                });
                return {};
            },
        },
    });
};

export default useBoardWikiDetailsChangedHandlers;

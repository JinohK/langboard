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
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiDetailsChangedHandlers = ({ callback, projectUID, wikiUID, userUID }: IUseBoardWikiDetailsChangedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler<{}, IBoardWikiDetailsChangedRawResponse>({
        topic,
        topicId,
        eventKey: `board-wiki-details-changed-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.DETAILS_CHANGED,
            params: { uid: wikiUID },
            callback,
            responseConverter: (data) => {
                const wiki = ProjectWiki.Model.getModel(wikiUID);
                if (wiki) {
                    Object.entries(data).forEach(([key, value]) => {
                        wiki[key] = value as string & IEditorContent;
                    });
                }
                return {};
            },
        },
    });
};

export default useBoardWikiDetailsChangedHandlers;

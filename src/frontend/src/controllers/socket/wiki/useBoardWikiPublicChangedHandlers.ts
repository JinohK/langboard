import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, ProjectWiki } from "@/core/models";

export interface IBoardWikiPublicChangedRawResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiPublicChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wiki: ProjectWiki.TModel;
    currentUser: AuthUser.TModel;
}

const useBoardWikiPublicChangedHandlers = ({ callback, projectUID, currentUser, wiki }: IUseBoardWikiPublicChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardWikiPublicChangedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-public-changed-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.PUBLIC_CHANGED,
            params: { uid: wiki.uid },
            callback,
            responseConverter: (data) => {
                ProjectWiki.Model.fromObject(data.wiki, true);
                if (!wiki.is_public && !currentUser.is_admin) {
                    if (!wiki.assigned_members.some((member) => member.uid === currentUser.uid)) {
                        wiki.changeToPrivate();
                    }
                }
                return {};
            },
        },
    });
};

export default useBoardWikiPublicChangedHandlers;

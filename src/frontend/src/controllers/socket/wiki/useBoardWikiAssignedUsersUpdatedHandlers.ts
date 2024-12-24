import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki, User } from "@/core/models";

export interface IBoardWikiAssignedUsersUpdatedResponse {
    wiki: ProjectWiki.Interface;
}

export interface IUseBoardWikiAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiAssignedUsersUpdatedResponse> {
    projectUID: string;
    wikiUID: string;
    userUID?: string;
}

const useBoardWikiAssignedUsersUpdatedHandlers = ({
    socket,
    callback,
    projectUID,
    wikiUID,
    userUID,
}: IUseBoardWikiAssignedUsersUpdatedHandlersProps) => {
    const topic = userUID ? ESocketTopic.BoardWikiPrivate : ESocketTopic.BoardWiki;
    const topicId = userUID ?? projectUID;

    return useSocketHandler({
        socket,
        topic,
        topicId,
        eventKey: `board-wiki-assigned-users-updated-${topic}-${wikiUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.ASSIGNED_USERS_UPDATED,
            params: { uid: wikiUID },
            callback,
            responseConverter: (data) => {
                User.transformFromApi(data.wiki.assigned_members);
                return data;
            },
        },
    });
};

export default useBoardWikiAssignedUsersUpdatedHandlers;

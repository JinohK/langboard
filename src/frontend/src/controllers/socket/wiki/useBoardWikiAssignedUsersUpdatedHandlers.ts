import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, ProjectWiki, User } from "@/core/models";

export interface IBoardWikiAssignedUsersUpdatedRawResponse {
    wiki_uid: string;
    assigned_members: User.Interface[];
}

export interface IUseBoardWikiAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wiki: ProjectWiki.TModel;
    currentUser: AuthUser.TModel;
}

const useBoardWikiAssignedUsersUpdatedHandlers = ({ callback, projectUID, wiki, currentUser }: IUseBoardWikiAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBoardWikiAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-assigned-users-updated-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.ASSIGNED_USERS_UPDATED,
            params: { uid: wiki.uid },
            callback,
            responseConverter: (data) => {
                if (wiki.uid !== data.wiki_uid || wiki.is_public) {
                    return {};
                }

                if (!currentUser.is_admin) {
                    if (!data.assigned_members.some((member) => member.uid === currentUser.uid)) {
                        wiki.changeToPrivate();
                    }
                }

                return {};
            },
        },
    });
};

export default useBoardWikiAssignedUsersUpdatedHandlers;

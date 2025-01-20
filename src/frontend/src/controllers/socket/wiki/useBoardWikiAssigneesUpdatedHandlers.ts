import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useBoardWikiGetDetailsHandlers from "@/controllers/socket/wiki/useBoardWikiGetDetailsHandlers";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, BotModel, ProjectWiki, User } from "@/core/models";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";

export interface IBoardWikiAssigneesUpdatedRawResponse {
    assigned_bots: BotModel.Interface[];
    assigned_members: User.Interface[];
}

export interface IUseBoardWikiAssigneesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    wiki: ProjectWiki.TModel;
    currentUser: AuthUser.TModel;
}

const useBoardWikiAssigneesUpdatedHandlers = ({ callback, projectUID, wiki, currentUser }: IUseBoardWikiAssigneesUpdatedHandlersProps) => {
    const socket = useSocketOutsideProvider();
    const { send: sendGetDetails } = useBoardWikiGetDetailsHandlers({ wiki });

    return useSocketHandler<{}, IBoardWikiAssigneesUpdatedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-assignees-updated-${wiki.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.WIKI.ASSIGNEES_UPDATED,
            params: { uid: wiki.uid },
            callback,
            responseConverter: (data) => {
                if (wiki.is_public) {
                    return {};
                }

                if (!currentUser.is_admin && !data.assigned_members.some((member) => member.uid === currentUser.uid)) {
                    wiki.changeToPrivate();
                    return {};
                }

                if (!socket.isSubscribed(ESocketTopic.BoardWikiPrivate, wiki.uid)) {
                    socket.subscribe(ESocketTopic.BoardWikiPrivate, [wiki.uid], () => {
                        sendGetDetails({});
                    });
                } else {
                    wiki.assigned_bots = data.assigned_bots;
                    wiki.assigned_members = data.assigned_members;
                }

                return {};
            },
        },
    });
};

export default useBoardWikiAssigneesUpdatedHandlers;

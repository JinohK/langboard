import { API_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, BotModel, ProjectWiki, User } from "@/core/models";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { format } from "@/core/utils/StringUtils";

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
                        api.get(
                            format(API_ROUTES.BOARD.WIKI.GET_DETAILS, {
                                uid: projectUID,
                                wiki_uid: wiki.uid,
                            })
                        ).then((response) => {
                            ProjectWiki.Model.fromObject(response.data.wiki, true);
                        });
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

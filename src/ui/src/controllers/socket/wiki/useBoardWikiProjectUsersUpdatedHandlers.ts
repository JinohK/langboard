import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardWikiProjectUsersUpdatedResponse {
    assigned_members: User.TModel[];
}

export interface IBoardWikiProjectUsersUpdatedRawResponse {
    assigned_members: User.Interface[];
}

export interface IUseBoardWikiProjectUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiProjectUsersUpdatedResponse> {
    projectUID: string;
}

const useBoardWikiProjectUsersUpdatedHandlers = ({ callback, projectUID }: IUseBoardWikiProjectUsersUpdatedHandlersProps) => {
    return useSocketHandler<IBoardWikiProjectUsersUpdatedResponse, IBoardWikiProjectUsersUpdatedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-project-users-updated-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                return {
                    assigned_members: User.Model.fromArray(data.assigned_members),
                };
            },
        },
    });
};

export default useBoardWikiProjectUsersUpdatedHandlers;

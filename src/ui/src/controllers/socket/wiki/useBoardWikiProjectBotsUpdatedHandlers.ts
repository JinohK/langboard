import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";

export interface IBoardWikiAssignedBotsUpdatedResponse {
    assigned_bots: BotModel.TModel[];
}

export interface IBoardWikiAssignedBotsUpdatedRawResponse {
    assigned_bots: BotModel.Interface[];
}

export interface IUseBoardWikiAssignedBotsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardWikiAssignedBotsUpdatedResponse> {
    projectUID: string;
}

const useBoardWikiProjectBotsUpdatedHandlers = ({ callback, projectUID }: IUseBoardWikiAssignedBotsUpdatedHandlersProps) => {
    return useSocketHandler<IBoardWikiAssignedBotsUpdatedResponse, IBoardWikiAssignedBotsUpdatedRawResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-project-bots-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_BOTS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                return {
                    assigned_bots: BotModel.Model.fromArray(data.assigned_bots),
                };
            },
        },
    });
};

export default useBoardWikiProjectBotsUpdatedHandlers;

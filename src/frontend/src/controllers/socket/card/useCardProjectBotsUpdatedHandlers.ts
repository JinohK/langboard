import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, BotModel } from "@/core/models";

export interface ICardProjectBotsUpdatedRawResponse {
    assigned_bots: BotModel.Interface[];
}

export interface IUseCardProjectBotsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    card: ProjectCard.TModel;
}

const useCardProjectBotsUpdatedHandlers = ({ callback, projectUID, card }: IUseCardProjectBotsUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardProjectBotsUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-project-bots-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_BOTS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                card.project_bots = data.assigned_bots;
                return {};
            },
        },
    });
};

export default useCardProjectBotsUpdatedHandlers;

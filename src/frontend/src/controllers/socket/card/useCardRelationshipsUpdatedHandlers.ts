import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface ICardRelationshipsUpdatedResponse {
    card_uid: string;
    relationships: ProjectCard.IRelationship[];
    parent_card_uids: string[];
    child_card_uids: string[];
}

export interface IUseCardRelationshipsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<ICardRelationshipsUpdatedResponse> {
    projectUID: string;
}

const useCardRelationshipsUpdatedHandlers = ({ socket, callback, projectUID }: IUseCardRelationshipsUpdatedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-relationships-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.RELATIONSHIPS_UPDATED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useCardRelationshipsUpdatedHandlers;

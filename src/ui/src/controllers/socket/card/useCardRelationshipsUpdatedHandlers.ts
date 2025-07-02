import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCardRelationship } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardRelationshipsUpdatedRawResponse {
    card_uid: string;
    relationships: ProjectCardRelationship.Interface[];
}

export interface IUseCardRelationshipsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useCardRelationshipsUpdatedHandlers = ({ callback, projectUID }: IUseCardRelationshipsUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardRelationshipsUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-relationships-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.RELATIONSHIPS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(data.card_uid);
                if (card) {
                    ProjectCardRelationship.Model.deleteModels(card.relationships.map((r) => r.uid));
                }
                ProjectCardRelationship.Model.fromArray(data.relationships, true);
                return {};
            },
        },
    });
};

export default useCardRelationshipsUpdatedHandlers;

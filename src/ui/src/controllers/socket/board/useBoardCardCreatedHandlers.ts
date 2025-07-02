import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardCardCreatedRawResponse {
    card: ProjectCard.IStore;
}

export interface IUseBoardCardCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    columnUID: string;
}

const useBoardCardCreatedHandlers = ({ callback, projectUID, columnUID }: IUseBoardCardCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardCardCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-created-${columnUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CREATED,
            params: { uid: columnUID },
            callback,
            responseConverter: (data) => {
                ProjectCard.Model.fromOne(data.card, true);
                return {};
            },
        },
    });
};

export default useBoardCardCreatedHandlers;

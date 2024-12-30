import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";

export interface ICardDescriptionChangedRawResponse {
    description: IEditorContent;
}

export interface IUseCardDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardDescriptionChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardDescriptionChangedHandlersProps) => {
    return useSocketHandler<{}, ICardDescriptionChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-description-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DESCRIPTION_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.description = data.description;
                }
                return {};
            },
        },
    });
};

export default useCardDescriptionChangedHandlers;

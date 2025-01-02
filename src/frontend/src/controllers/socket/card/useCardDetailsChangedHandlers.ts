import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";

export interface ICardDetailsChangedRawResponse {
    title?: string;
    description?: IEditorContent;
    deadline_at?: string;
}

export interface IUseCardDetailsChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardDetailsChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardDetailsChangedHandlersProps) => {
    return useSocketHandler<{}, ICardDetailsChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-details-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DETAILS_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    Object.entries(data).forEach(([key, value]) => {
                        card[key] = value as (string & IEditorContent) | (Date & string & IEditorContent);
                    });
                }
                return {};
            },
        },
    });
};

export default useCardDetailsChangedHandlers;

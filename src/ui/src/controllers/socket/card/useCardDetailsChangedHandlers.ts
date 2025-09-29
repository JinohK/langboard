import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.CARD.DETAILS_CHANGED,
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

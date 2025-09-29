import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCheckitemTitleChangedRawResponse {
    title: string;
}

export interface IUseCardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemTitleChangedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemTitleChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-title-changed-${checkitem.uid}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CARD.CHECKITEM.TITLE_CHANGED,
            params: { uid: checkitem.uid },
            callback,
            responseConverter: (data) => {
                checkitem.title = data.title;
                return {};
            },
        },
    });
};

export default useCardCheckitemTitleChangedHandlers;

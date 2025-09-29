import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCheckitemCheckedChangedRawResponse {
    is_checked: bool;
}

export interface IUseCardCheckitemCheckedChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemCheckedChangedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemCheckedChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCheckedChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-checked-changed-${checkitem.uid}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CARD.CHECKITEM.CHECKED_CHANGED,
            params: { uid: checkitem.uid },
            callback,
            responseConverter: (data) => {
                checkitem.is_checked = data.is_checked;
                return {};
            },
        },
    });
};

export default useCardCheckitemCheckedChangedHandlers;

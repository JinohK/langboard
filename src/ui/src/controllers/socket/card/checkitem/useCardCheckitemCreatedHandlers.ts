import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCheckitemCreatedRawResponse {
    checkitem: ProjectCheckitem.Interface;
}

export interface IUseCardCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checklistUID: string;
}

const useCardCheckitemCreatedHandlers = ({ callback, cardUID, checklistUID }: IUseCardCheckitemCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCreatedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-created-${checklistUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CARD.CHECKITEM.CREATED,
            params: { uid: checklistUID },
            callback,
            responseConverter: (data) => {
                ProjectCheckitem.Model.fromOne(data.checkitem, true);
                return {};
            },
        },
    });
};

export default useCardCheckitemCreatedHandlers;

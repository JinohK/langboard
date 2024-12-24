import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCheckitemTitleChangedResponse {
    uid: string;
    title: string;
}

export interface IUseCardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemTitleChangedResponse> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemTitleChangedHandlers = ({ socket, callback, projectUID, checkitemUID }: IUseCardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-title-changed-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TITLE_CHANGED,
            params: { uid: checkitemUID },
            callback,
        },
    });
};

export default useCardCheckitemTitleChangedHandlers;

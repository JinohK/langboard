import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemTitleChangedRawResponse {
    uid: string;
    title: string;
}

export interface IUseCardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemTitleChangedHandlers = ({ callback, projectUID, checkitemUID }: IUseCardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemTitleChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-title-changed-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TITLE_CHANGED,
            params: { uid: checkitemUID },
            callback,
            responseConverter: (data) => {
                const checkitem = ProjectCheckitem.Model.getModel(data.uid);
                if (checkitem) {
                    checkitem.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useCardCheckitemTitleChangedHandlers;

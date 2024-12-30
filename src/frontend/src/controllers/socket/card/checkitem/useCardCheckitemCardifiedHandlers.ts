import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemCardifiedRawResponse {
    card: ProjectCard.IStore;
}

export interface IUseCardCheckitemCardifiedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemCardifiedHandlers = ({ callback, projectUID, checkitemUID }: IUseCardCheckitemCardifiedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCardifiedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-cardified-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CARDIFIED,
            params: { uid: checkitemUID },
            callback,
            responseConverter: (data) => {
                const checkitem = ProjectCheckitem.Model.getModel(checkitemUID);
                if (checkitem) {
                    checkitem.cardified_uid = data.card.uid;
                }
                ProjectCard.Model.fromObject(data.card, true);
                return {};
            },
        },
    });
};

export default useCardCheckitemCardifiedHandlers;

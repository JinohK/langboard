import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardSubCheckitemCreatedRawResponse {
    checkitem: ProjectCheckitem.IStore;
}

export interface IUseCardSubCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    checkitemUID: string;
}

const useCardSubCheckitemCreatedHandlers = ({ callback, projectUID, checkitemUID }: IUseCardSubCheckitemCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardSubCheckitemCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-sub-checkitem-created-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.SUB_CHECKITEM.CREATED,
            params: { uid: checkitemUID },
            callback,
            responseConverter: (data) => {
                data.checkitem.project_uid = projectUID;
                ProjectCheckitem.Model.fromObject(data.checkitem, true);
                return {};
            },
        },
    });
};

export default useCardSubCheckitemCreatedHandlers;

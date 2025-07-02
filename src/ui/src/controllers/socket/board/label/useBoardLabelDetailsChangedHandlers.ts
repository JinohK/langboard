import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardLabelDetailsChangedRawResponse {
    name?: string;
    color?: string;
    description?: string;
}

export interface IUseBoardLabelDetailsChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    labelUID: string;
}

const useBoardLabelDetailsChangedHandlers = ({ callback, projectUID, labelUID }: IUseBoardLabelDetailsChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardLabelDetailsChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-label-details-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.LABEL.DETAILS_CHANGED,
            params: { uid: labelUID },
            callback,
            responseConverter: (data) => {
                const label = ProjectLabel.Model.getModel(labelUID);
                if (label) {
                    Object.entries(data).forEach(([key, value]) => {
                        label[key] = value!;
                    });
                }
                return {};
            },
        },
    });
};

export default useBoardLabelDetailsChangedHandlers;

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseProjectLabelOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectLabelOrderChangedHandlers = ({ callback, projectUID }: IUseProjectLabelOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectLabelOrderChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const label = ProjectLabel.Model.getModel(data.uid);
                if (label) {
                    label.order = data.order;
                }
                return {};
            },
        },
    });
};

export default useProjectLabelOrderChangedHandlers;

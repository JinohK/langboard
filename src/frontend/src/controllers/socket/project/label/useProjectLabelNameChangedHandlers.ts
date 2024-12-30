import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelNameChangedRawResponse {
    name: string;
}

export interface IUseProjectLabelNameChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    labelUID: string;
}

const useProjectLabelNameChangedHandlers = ({ callback, projectUID, labelUID }: IUseProjectLabelNameChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectLabelNameChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-name-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.NAME_CHANGED,
            params: { uid: labelUID },
            callback,
            responseConverter: (data) => {
                const label = ProjectLabel.Model.getModel(labelUID);
                if (label) {
                    label.name = data.name;
                }
                return {};
            },
        },
    });
};

export default useProjectLabelNameChangedHandlers;

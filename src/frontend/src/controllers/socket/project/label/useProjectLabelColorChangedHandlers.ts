import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelColorChangedRawResponse {
    color: string;
}

export interface IUseProjectLabelColorChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    labelUID: string;
}

const useProjectLabelColorChangedHandlers = ({ callback, projectUID, labelUID }: IUseProjectLabelColorChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectLabelColorChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-color-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.COLOR_CHANGED,
            params: { uid: labelUID },
            callback,
            responseConverter: (data) => {
                const label = ProjectLabel.Model.getModel(labelUID);
                if (label) {
                    label.color = data.color;
                }
                return {};
            },
        },
    });
};

export default useProjectLabelColorChangedHandlers;

import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelDescriptionChangedRawResponse {
    description: string;
}

export interface IUseProjectLabelDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    labelUID: string;
}

const useProjectLabelDescriptionChangedHandlers = ({ callback, projectUID, labelUID }: IUseProjectLabelDescriptionChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectLabelDescriptionChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-description-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.DESCRIPTION_CHANGED,
            params: { uid: labelUID },
            callback,
            responseConverter: (data) => {
                const label = ProjectLabel.Model.getModel(labelUID);
                if (label) {
                    label.description = data.description;
                }
                return {};
            },
        },
    });
};

export default useProjectLabelDescriptionChangedHandlers;

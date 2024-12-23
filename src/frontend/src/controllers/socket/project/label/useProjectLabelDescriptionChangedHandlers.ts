import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectLabelDescriptionChangedRequest {}

export interface IProjectLabelDescriptionChangedResponse {
    description: string;
}

export interface IUseProjectLabelDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectLabelDescriptionChangedResponse> {
    projectUID: string;
    labelUID: string;
}

const useProjectLabelDescriptionChangedHandlers = ({ socket, callback, projectUID, labelUID }: IUseProjectLabelDescriptionChangedHandlersProps) => {
    return useSocketHandler<IProjectLabelDescriptionChangedRequest, IProjectLabelDescriptionChangedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-description-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.DESCRIPTION_CHANGED,
            params: { uid: labelUID },
            callback,
        },
    });
};

export default useProjectLabelDescriptionChangedHandlers;

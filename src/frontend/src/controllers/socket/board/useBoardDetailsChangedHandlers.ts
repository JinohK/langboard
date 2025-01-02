import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IBoardDetailsChangedRawResponse {
    title?: string;
    description?: string;
    ai_description?: string;
    project_type?: string;
}

export interface IUseBoardDetailsChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardDetailsChangedHandlers = ({ callback, projectUID }: IUseBoardDetailsChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardDetailsChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-details-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.DETAILS_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    Object.entries(data).forEach(([key, value]) => {
                        project[key] = value!;
                    });
                }
                return {};
            },
        },
    });
};

export default useBoardDetailsChangedHandlers;

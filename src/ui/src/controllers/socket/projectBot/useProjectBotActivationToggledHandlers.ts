import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectBotActivationToggledResponse {
    is_disabled: bool;
}

export interface IUseProjectBotActivationToggledHandlersProps extends IBaseUseSocketHandlersProps<IProjectBotActivationToggledResponse> {
    projectUID: string;
    botUID: string;
}

const useProjectBotActivationToggledHandlers = ({ callback, projectUID, botUID }: IUseProjectBotActivationToggledHandlersProps) => {
    return useSocketHandler<IProjectBotActivationToggledResponse, IProjectBotActivationToggledResponse>({
        topic: ESocketTopic.ProjectBot,
        topicId: `${botUID}-${projectUID}`,
        eventKey: `project-bot-activation-toggled-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT_BOT.ACTIVATION_TOGGLED,
            params: { uid: botUID },
            callback,
        },
    });
};

export default useProjectBotActivationToggledHandlers;

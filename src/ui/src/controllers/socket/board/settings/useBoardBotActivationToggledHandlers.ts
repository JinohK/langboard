import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotActivationToggledResponse {
    bot_uid: string;
    is_disabled: bool;
}

export interface IUseBoardBotActivationToggledHandlersProps extends IBaseUseSocketHandlersProps<IBoardBotActivationToggledResponse> {
    projectUID: string;
}

const useBoardBotActivationToggledHandlers = ({ callback, projectUID }: IUseBoardBotActivationToggledHandlersProps) => {
    return useSocketHandler<IBoardBotActivationToggledResponse, IBoardBotActivationToggledResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-settings-bot-activation-toggled-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.SETTINGS.BOT_ACTIVATION_TOGGLED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useBoardBotActivationToggledHandlers;

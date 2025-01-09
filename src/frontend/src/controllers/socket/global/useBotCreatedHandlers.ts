import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";

export interface IBotCreatedRawResponse {
    bot: BotModel.Interface;
}

const useBotCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IBotCreatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "bot-created",
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.BOTS.CREATED,
            callback,
            responseConverter: (data) => {
                BotModel.Model.fromObject(data.bot, true);
                return {};
            },
        },
    });
};

export default useBotCreatedHandlers;

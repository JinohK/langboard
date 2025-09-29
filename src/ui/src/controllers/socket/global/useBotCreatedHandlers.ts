import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBotCreatedRawResponse {
    bot: BotModel.Interface;
}

const useBotCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IBotCreatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "bot-created",
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.BOTS.CREATED,
            callback,
            responseConverter: (data) => {
                BotModel.Model.fromOne(data.bot, true);
                return {};
            },
        },
    });
};

export default useBotCreatedHandlers;

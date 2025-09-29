import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBotDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    bot: BotModel.TModel;
}

const useBotDeletedHandlers = ({ callback, bot }: IUseBotDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Global,
        eventKey: `bot-deleted-${bot.uid}`,
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.BOTS.DELETED,
            params: { uid: bot.uid },
            callback,
            responseConverter: () => {
                BotModel.Model.deleteModel(bot.uid);

                return {};
            },
        },
    });
};

export default useBotDeletedHandlers;

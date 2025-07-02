import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBotUpdatedRawResponse {
    name?: string;
    bot_uname?: string;
    deleted_avatar?: bool;
    avatar?: string;
}

export interface IUseBotUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    bot: BotModel.TModel;
}

const useBotUpdatedHandlers = ({ callback, bot }: IUseBotUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBotUpdatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: `bot-updated-${bot.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.BOTS.UPDATED,
            params: { uid: bot.uid },
            callback,
            responseConverter: (data) => {
                if (data.name) {
                    bot.name = data.name;
                }

                if (data.bot_uname) {
                    bot.bot_uname = data.bot_uname;
                }

                if (data.deleted_avatar) {
                    bot.avatar = undefined;
                } else if (data.avatar) {
                    bot.avatar = data.avatar;
                }

                return {};
            },
        },
    });
};

export default useBotUpdatedHandlers;

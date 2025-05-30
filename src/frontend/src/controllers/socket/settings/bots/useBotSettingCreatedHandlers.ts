import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";

export interface IBotSettingCreatedRawResponse {
    bot: BotModel.Interface;
}

const useBotSettingCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IBotSettingCreatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: "all",
        eventKey: "bot-setting-created",
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.BOTS.CREATED,
            callback,
            responseConverter: (data) => {
                BotModel.Model.fromObject(data.bot, true);
                return {};
            },
        },
    });
};

export default useBotSettingCreatedHandlers;

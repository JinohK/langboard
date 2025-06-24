import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";

export interface IBotSettingCreatedRawResponse {
    setting_bot: BotModel.Interface;
}

const useBotSettingCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IBotSettingCreatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "bot-setting-created",
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.BOTS.CREATED,
            callback,
            responseConverter: (data) => {
                BotModel.Model.fromOne(data.setting_bot, true);
                return {};
            },
        },
    });
};

export default useBotSettingCreatedHandlers;

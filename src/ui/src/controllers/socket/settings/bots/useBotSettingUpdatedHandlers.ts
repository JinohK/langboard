import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface IBotSettingUpdatedRawResponse {
    api_url?: string;
    api_auth_type?: BotModel.EAPIAuthType;
    api_key?: string;
    app_api_token?: string;
    ip_whitelist?: string[];
    prompt: string;
}

export interface IUseBotSettingUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    bot: BotModel.TModel;
}

const useBotSettingUpdatedHandlers = ({ callback, bot }: IUseBotSettingUpdatedHandlersProps) => {
    return useSocketHandler<{}, IBotSettingUpdatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `bot-setting-updated-${bot.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.BOTS.UPDATED,
            params: { uid: bot.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    if (key === "api_auth_type") {
                        if (TypeUtils.isString(value)) {
                            value = BotModel.EAPIAuthType[new StringCase(value).toPascal() as keyof typeof BotModel.EAPIAuthType];
                        }
                    }

                    bot[key] = value as never;
                });

                return {};
            },
        },
    });
};

export default useBotSettingUpdatedHandlers;

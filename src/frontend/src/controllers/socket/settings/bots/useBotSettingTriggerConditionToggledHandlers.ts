import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { EBotTriggerCondition } from "@/core/models/bot.type";
import { StringCase } from "@/core/utils/StringUtils";

export interface IBotSettingTriggerConditionToggledRawResponse {
    condition: EBotTriggerCondition;
    is_enabled: bool;
}

export interface IUseBotSettingTriggerConditionToggledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    bot: BotModel.TModel;
}

const useBotSettingTriggerConditionToggledHandlers = ({ callback, bot }: IUseBotSettingTriggerConditionToggledHandlersProps) => {
    return useSocketHandler<{}, IBotSettingTriggerConditionToggledRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: "all",
        eventKey: `bot-setting-trigger-condition-predefined-${bot.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.BOTS.TRIGGER_CONDITION_TOGGLED,
            params: { uid: bot.uid },
            callback,
            responseConverter: (data) => {
                const newConditions = { ...bot.conditions };

                const condition = EBotTriggerCondition[new StringCase(data.condition).toPascal() as keyof typeof EBotTriggerCondition];

                if (data.is_enabled) {
                    newConditions[condition] = { is_predefined: false };
                } else {
                    delete newConditions[condition];
                }

                bot.conditions = newConditions;

                return {};
            },
        },
    });
};

export default useBotSettingTriggerConditionToggledHandlers;

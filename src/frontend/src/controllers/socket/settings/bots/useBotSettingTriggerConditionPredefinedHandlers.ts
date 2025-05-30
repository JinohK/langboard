import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { EBotTriggerCondition } from "@/core/models/bot.type";
import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface IBotSettingTriggerConditionPredefinedRawResponse {
    conditions: EBotTriggerCondition[];
}

export interface IUseBotSettingTriggerConditionPredefinedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    bot: BotModel.TModel;
}

const useBotSettingTriggerConditionPredefinedHandlers = ({ callback, bot }: IUseBotSettingTriggerConditionPredefinedHandlersProps) => {
    return useSocketHandler<{}, IBotSettingTriggerConditionPredefinedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: "all",
        eventKey: `bot-setting-trigger-condition-predefined-${bot.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.BOTS.TRIGGER_CONDITION_PREDEFINED,
            params: { uid: bot.uid },
            callback,
            responseConverter: (data) => {
                const newConditions = { ...bot.conditions };
                for (let i = 0; i < data.conditions.length; ++i) {
                    const condition = data.conditions[i];
                    if (TypeUtils.isString(condition)) {
                        const conditionKey = EBotTriggerCondition[new StringCase(condition).toPascal() as keyof typeof EBotTriggerCondition];
                        newConditions[conditionKey] = { is_predefined: true };
                    }
                }

                bot.conditions = newConditions;

                return {};
            },
        },
    });
};

export default useBotSettingTriggerConditionPredefinedHandlers;

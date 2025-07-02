import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";
import { EBotTriggerCondition } from "@/core/models/bot.type";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

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
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `bot-setting-trigger-condition-predefined-${bot.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.BOTS.TRIGGER_CONDITION_TOGGLED,
            params: { uid: bot.uid },
            callback,
            responseConverter: (data) => {
                const newConditions = { ...bot.conditions };

                const condition = EBotTriggerCondition[new Utils.String.Case(data.condition).toPascal() as keyof typeof EBotTriggerCondition];

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

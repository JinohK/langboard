import { Box, Flex } from "@/components/base";
import { CATEGORIZED_BOT_TRIGGER_CONDITIONS } from "@/core/models/bot.type";
import { Utils } from "@langboard/core/utils";
import BotTriggerCondition from "@/pages/SettingsPage/components/bots/BotTriggerCondition";
import { useTranslation } from "react-i18next";

function BotTriggerConditionList() {
    const [t] = useTranslation();

    return (
        <Flex direction="col" gap={{ initial: "3", md: "4" }} border rounded="md" py="2" px="3">
            <h4 className="text-lg font-semibold tracking-tight">{t("settings.Trigger conditions")}</h4>
            {Object.keys(CATEGORIZED_BOT_TRIGGER_CONDITIONS).map((category) => (
                <Flex direction="col" gap={{ initial: "1", md: "2" }} key={Utils.String.Token.shortUUID()}>
                    <Box>{t(`botTriggerCondition.${category}.Category`)}</Box>
                    <BotTriggerConditionCategory category={category} />
                </Flex>
            ))}
        </Flex>
    );
}

interface IBotTriggerConditionProps {
    category: keyof typeof CATEGORIZED_BOT_TRIGGER_CONDITIONS;
}

function BotTriggerConditionCategory({ category }: IBotTriggerConditionProps) {
    const conditions = CATEGORIZED_BOT_TRIGGER_CONDITIONS[category];

    return (
        <Flex gap={{ initial: "1", md: "2" }} wrap>
            {conditions.map((condition) => (
                <BotTriggerCondition key={Utils.String.Token.shortUUID()} category={category} conditionType={condition} />
            ))}
        </Flex>
    );
}

export default BotTriggerConditionList;

import { Box, Checkbox, Flex, Label, Toast } from "@/components/base";
import useToggleBotTriggerCondition from "@/controllers/api/settings/bots/useToggleBotTriggerCondition";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { CATEGORIZED_BOT_TRIGGER_CONDITIONS, EBotTriggerCondition } from "@/core/models/bot.type";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotTriggerConditionProps {
    bot: BotModel.TModel;
    category: keyof typeof CATEGORIZED_BOT_TRIGGER_CONDITIONS;
    conditionType: EBotTriggerCondition;
}

const BotTriggerCondition = memo(({ bot, category, conditionType }: IBotTriggerConditionProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const conditions = bot.useField("conditions");
    const condition = useMemo(() => conditions?.[conditionType], [conditions]);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useToggleBotTriggerCondition(bot);

    const toggle = () => {
        if (isValidating) {
            return;
        }

        const promise = mutateAsync({
            condition: conditionType,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            messageRef.message = t("errors.Forbidden");
                            navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("settings.successes.Bot trigger condition changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    if (condition && condition.is_predefined) {
        return (
            <Flex items="center" gap="3" p="2" cursor="not-allowed">
                <Checkbox checked disabled />
                <Box>{t(`botTriggerCondition.${category}.conditions.${conditionType}`)}</Box>
            </Flex>
        );
    }

    return (
        <Label
            display="flex"
            items="center"
            gap="3"
            p="2"
            cursor={isValidating ? "not-allowed" : "pointer"}
            className={cn("transition-all", isValidating ? "opacity-70" : "hover:text-foreground/70")}
        >
            <Checkbox checked={!!condition} onCheckedChange={toggle} disabled={isValidating} />
            <Box>{t(`botTriggerCondition.${category}.conditions.${conditionType}`)}</Box>
        </Label>
    );
});

export default BotTriggerCondition;

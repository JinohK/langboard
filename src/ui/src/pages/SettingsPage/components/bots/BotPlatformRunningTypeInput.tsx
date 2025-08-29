import { Box, Floating, Select, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { AVAILABLE_RUNNING_TYPES_BY_PLATFORM, EBotPlatformRunningType } from "@/core/models/bot.related.type";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BotPlatformRunningTypeInput = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.BotModel.useContext();
    const navigate = usePageNavigateRef();
    const platform = internalBot.useField("platform");
    const platformRunningType = internalBot.useField("platform_running_type");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateBot(internalBot, { interceptToast: true });

    const changePlatformRunningType = async (value: EBotPlatformRunningType) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            platform_running_type: value,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Bot platform running type changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Floating.LabelSelect
                label={t("settings.Select a platform running type")}
                value={platformRunningType}
                defaultValue={platformRunningType.toString()}
                onValueChange={changePlatformRunningType}
                disabled={isValidating}
                options={AVAILABLE_RUNNING_TYPES_BY_PLATFORM[platform].map((targetPlatformRunningType) => (
                    <Select.Item value={targetPlatformRunningType.toString()} key={`bot-platform-running-type-select-${targetPlatformRunningType}`}>
                        {t(`bot.platformRunningTypes.${targetPlatformRunningType}`)}
                    </Select.Item>
                ))}
            />
        </Box>
    );
});

export default BotPlatformRunningTypeInput;

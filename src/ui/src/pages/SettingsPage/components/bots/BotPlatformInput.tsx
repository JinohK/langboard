import { Box, Floating, Select, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EBotPlatform } from "@/core/models/bot.related.type";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BotPlatformInput = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.BotModel.useContext();
    const navigate = usePageNavigateRef();
    const platform = internalBot.useField("platform");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateBot(internalBot, { interceptToast: true });

    const changePlatform = async (value: EBotPlatform) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            platform: value,
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
                return t("successes.Bot platform changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Floating.LabelSelect
                label={t("settings.Select a platform")}
                value={platform}
                defaultValue={platform.toString()}
                onValueChange={changePlatform}
                disabled={isValidating}
                options={Object.keys(EBotPlatform).map((platformKey) => {
                    const targetPlatform = EBotPlatform[platformKey];
                    return (
                        <Select.Item value={targetPlatform.toString()} key={`bot-platform-select-${targetPlatform}`}>
                            {t(`bot.platforms.${targetPlatform}`)}
                        </Select.Item>
                    );
                })}
            />
        </Box>
    );
});

export default BotPlatformInput;

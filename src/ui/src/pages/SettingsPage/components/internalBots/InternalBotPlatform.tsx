import { Box, Select, Toast } from "@/components/base";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { InternalBotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotPlatform = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const { navigateRef } = useAppSetting();
    const platform = internalBot.useField("platform");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });

    const changeAPIAuthType = async (value: InternalBotModel.EInternalBotPlatform) => {
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
                            after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Internal bot platform changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Select.Root value={platform} onValueChange={changeAPIAuthType} disabled={isValidating}>
                <Select.Trigger defaultValue={platform.toString()}>
                    <Select.Value placeholder={t("settings.Select a platform")} />
                </Select.Trigger>
                <Select.Content>
                    {Object.keys(InternalBotModel.EInternalBotPlatform).map((platformKey) => {
                        const targetPlatform = InternalBotModel.EInternalBotPlatform[platformKey];
                        return (
                            <Select.Item value={targetPlatform.toString()} key={`internalBot-platform-select-${targetPlatform}`}>
                                {t(`internalBot.platforms.${targetPlatform}`)}
                            </Select.Item>
                        );
                    })}
                </Select.Content>
            </Select.Root>
        </Box>
    );
});

export default InternalBotPlatform;

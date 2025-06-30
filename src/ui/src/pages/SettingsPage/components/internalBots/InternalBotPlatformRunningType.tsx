import { Box, Select, Toast } from "@/components/base";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { InternalBotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotPlatformRunningType = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const navigate = usePageNavigateRef();
    const platformRunningType = internalBot.useField("platform_running_type");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });

    const changeAPIAuthType = async (value: InternalBotModel.EInternalBotPlatformRunningType) => {
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
                return t("successes.Internal bot platform running type changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Select.Root value={platformRunningType} onValueChange={changeAPIAuthType} disabled={isValidating}>
                <Select.Trigger defaultValue={platformRunningType.toString()}>
                    <Select.Value placeholder={t("settings.Select a platform running type")} />
                </Select.Trigger>
                <Select.Content>
                    {Object.keys(InternalBotModel.EInternalBotPlatformRunningType).map((platformRunningTypeKey) => {
                        const targetPlatformRunningType = InternalBotModel.EInternalBotPlatformRunningType[platformRunningTypeKey];
                        return (
                            <Select.Item
                                value={targetPlatformRunningType.toString()}
                                key={`internalBot-platform-running-type-select-${targetPlatformRunningType}`}
                            >
                                {t(`internalBot.platformRunningTypes.${targetPlatformRunningType}`)}
                            </Select.Item>
                        );
                    })}
                </Select.Content>
            </Select.Root>
        </Box>
    );
});

export default InternalBotPlatformRunningType;

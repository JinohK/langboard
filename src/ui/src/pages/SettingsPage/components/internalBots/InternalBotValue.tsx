import { Alert, Box, Toast } from "@/components/base";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { InternalBotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import InternalBotValueInput from "@/pages/SettingsPage/components/internalBots/InternalBotValueInput";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";

const InternalBotValue = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const navigate = usePageNavigateRef();
    const platformRunningType = internalBot.useField("platform_running_type");
    const value = internalBot.useField("value");
    const valueType = useMemo(() => {
        switch (platformRunningType) {
            case InternalBotModel.EInternalBotPlatformRunningType.FlowJson:
                return "json";
            default:
                return "text";
        }
    }, [platformRunningType]);
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });
    const newValueRef = useRef<string>(value);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating || !newValueRef.current) {
            return;
        }

        const newValue = newValueRef.current.trim();
        if (value.trim() === newValue || !newValue) {
            newValueRef.current = newValue;
            return;
        }

        const promise = mutateAsync({
            value: newValue,
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
                return t("successes.Internal bot value changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box w="full">
            {platformRunningType === InternalBotModel.EInternalBotPlatformRunningType.FlowJson && (
                <Alert variant="warning" icon="alert-triangle" title={t("common.Warning")} className="mb-2">
                    {t("settings.Flow json is only supported in the internal flows server.")}
                </Alert>
            )}
            <InternalBotValueInput value={value} valueType={valueType} newValueRef={newValueRef} isValidating={isValidating} change={change} />
        </Box>
    );
});

export default InternalBotValue;

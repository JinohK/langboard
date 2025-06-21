import { Box, Floating, Toast } from "@/components/base";
import useUpdateInternalBot from "@/controllers/api/settings/internalBots/useUpdateInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const InternalBotApiKey = memo(() => {
    const [t] = useTranslation();
    const { model: internalBot } = ModelRegistry.InternalBotModel.useContext();
    const { navigateRef } = useAppSetting();
    const apiKey = internalBot.useField("api_key");
    const { mutateAsync } = useUpdateInternalBot(internalBot, { interceptToast: true });
    const inputRef = useRef<HTMLInputElement>(null);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating || !inputRef.current) {
            return;
        }

        const value = inputRef.current.value.trim();
        if (value === apiKey) {
            inputRef.current.value = apiKey;
            return;
        }

        const promise = mutateAsync({
            api_key: value,
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
                return t("settings.successes.Internal bot API key changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            change();
            return;
        }
    };

    return (
        <Box>
            <Floating.LabelInput
                label={t("settings.Internal bot API key")}
                autoComplete="off"
                defaultValue={apiKey}
                onBlur={change}
                onKeyDown={handleKeyDown}
                ref={inputRef}
            />
        </Box>
    );
});

export default InternalBotApiKey;

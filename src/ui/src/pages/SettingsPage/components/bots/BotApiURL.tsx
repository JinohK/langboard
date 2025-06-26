import { Box, Floating, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { isValidURL } from "@/core/utils/StringUtils";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const BotApiURL = memo(() => {
    const [t] = useTranslation();
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const { navigateRef } = useAppSetting();
    const apiURL = bot.useField("api_url");
    const { mutateAsync } = useUpdateBot(bot, { interceptToast: true });
    const inputRef = useRef<HTMLInputElement>(null);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating || !inputRef.current) {
            return;
        }

        const value = inputRef.current.value.trim();
        if (value === apiURL || !value || !isValidURL(value)) {
            inputRef.current.value = apiURL;
            return;
        }

        const promise = mutateAsync({
            api_url: value,
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
                return t("successes.Bot API URL changed successfully.");
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
                label={t("settings.Bot API URL")}
                autoComplete="off"
                defaultValue={apiURL}
                onBlur={change}
                onKeyDown={handleKeyDown}
                ref={inputRef}
            />
        </Box>
    );
});

export default BotApiURL;

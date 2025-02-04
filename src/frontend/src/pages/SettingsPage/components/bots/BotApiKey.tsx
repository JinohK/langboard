import { Box, Floating, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotApiKeyProps {
    bot: BotModel.TModel;
}

const BotApiKey = memo(({ bot }: IBotApiKeyProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const apiKey = bot.useField("api_key");
    const { mutateAsync } = useUpdateBot(bot);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isValidating, setIsValidating] = useState(false);

    const change = () => {
        if (isValidating || !inputRef.current) {
            return;
        }

        const value = inputRef.current.value.trim();
        if (value === apiKey || !value) {
            inputRef.current.value = apiKey;
            return;
        }

        const promise = mutateAsync({
            api_key: value,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                        navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: () => {
                return t("settings.successes.Bot API key changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Floating.LabelInput
                label={t("settings.Bot API key")}
                autoComplete="off"
                defaultValue={apiKey}
                onBlur={change}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        change();
                        return;
                    }
                }}
                ref={inputRef}
            />
        </Box>
    );
});

export default BotApiKey;

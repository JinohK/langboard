import { Box, Select, Toast } from "@/components/base";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotApiAuthTypeProps {
    bot: BotModel.TModel;
}

const BotApiAuthType = memo(({ bot }: IBotApiAuthTypeProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const apiAuthType = bot.useField("api_auth_type");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateBot(bot);

    const changeAPIAuthType = async (value: BotModel.EAPIAuthType) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            api_auth_type: value,
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
                return t("settings.successes.Bot API auth type changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Select.Root value={apiAuthType} onValueChange={(value) => changeAPIAuthType(value as BotModel.EAPIAuthType)} disabled={isValidating}>
                <Select.Trigger>
                    <Select.Value placeholder={t("settings.Select an api auth type")} />
                </Select.Trigger>
                <Select.Content>
                    {Object.keys(BotModel.EAPIAuthType).map((authTypeKey) => {
                        const authType = BotModel.EAPIAuthType[authTypeKey];
                        return (
                            <Select.Item value={authType} key={`bot-auth-type-select-${authType}`}>
                                {t(`settings.authTypes.${authType}`)}
                            </Select.Item>
                        );
                    })}
                </Select.Content>
            </Select.Root>
        </Box>
    );
});

export default BotApiAuthType;

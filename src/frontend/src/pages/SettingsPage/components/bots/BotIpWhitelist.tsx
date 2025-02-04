import { Box, Toast } from "@/components/base";
import MultiSelect from "@/components/MultiSelect";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { isValidIpv4OrRnage } from "@/core/utils/StringUtils";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotIpWhitelistProps {
    bot: BotModel.TModel;
}

const BotIpWhitelist = memo(({ bot }: IBotIpWhitelistProps) => {
    const [t] = useTranslation();
    const { navigate } = useAppSetting();
    const ipWhitelist = bot.useField("ip_whitelist");
    const [isValidating, setIsValidating] = useState(false);
    const isValidatingRef = useRef(isValidating);
    const { mutateAsync } = useUpdateBot(bot);
    const updateBot = (values: string[]) => {
        if (values.length === ipWhitelist.length || isValidatingRef.current) {
            return;
        }

        setIsValidating(true);
        isValidatingRef.current = true;

        const promise = mutateAsync({
            ip_whitelist: values,
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
                return t("settings.successes.Bot IP whitelist changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                isValidatingRef.current = false;
            },
        });
    };

    return (
        <Box>
            <MultiSelect
                selections={[]}
                placeholder={t("settings.Add a new IP address or range (e.g. 192.0.0.1 or 192.0.0.0/24)...")}
                selectedValue={ipWhitelist}
                onValueChange={updateBot}
                inputClassName="ml-1 placeholder:text-gray-500 placeholder:font-medium"
                canCreateNew
                validateCreatedNewValue={isValidIpv4OrRnage}
                createNewCommandItemLabel={(value) => {
                    const newIPs: string[] = [];

                    if (value.includes("/24")) {
                        newIPs.push(value, value.replace("/24", ""));
                    } else {
                        newIPs.push(value, `${value}/24`);
                    }

                    return newIPs.map((ip) => ({
                        label: ip,
                        value: ip,
                    }));
                }}
                isNewCommandItemMultiple
                disabled={isValidating}
            />
        </Box>
    );
});

export default BotIpWhitelist;

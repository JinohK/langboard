import { Box, Toast } from "@/components/base";
import MultiSelect from "@/components/MultiSelect";
import useUpdateBot from "@/controllers/api/settings/bots/useUpdateBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { isValidIpv4OrRnage } from "@/core/utils/StringUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BotIpWhitelist = memo(() => {
    const [t] = useTranslation();
    const { model: bot } = ModelRegistry.BotModel.useContext();
    const { navigateRef } = useAppSetting();
    const ipWhitelist = bot.useField("ip_whitelist");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useUpdateBot(bot);
    const updateBot = (values: string[]) => {
        if (values.length === ipWhitelist.length || isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            ip_whitelist: values,
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
                return t("settings.successes.Bot IP whitelist changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
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

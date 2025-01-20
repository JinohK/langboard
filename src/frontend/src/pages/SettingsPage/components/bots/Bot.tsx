import { Box, Button, Flex, Form, IconComponent, Toast } from "@/components/base";
import useDeleteBot from "@/controllers/api/settings/bots/useDeleteBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import BotAvatar from "@/pages/SettingsPage/components/bots/BotAvatar";
import BotName from "@/pages/SettingsPage/components/bots/BotName";
import BotUniqueName from "@/pages/SettingsPage/components/bots/BotUniqueName";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBotProps {
    bot: BotModel.TModel;
}

const Bot = memo(({ bot }: IBotProps) => {
    const [t] = useTranslation();
    const { navigate, isValidating, setIsValidating } = useAppSetting();
    const { mutateAsync } = useDeleteBot(bot);

    const deleteBot = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({});

        const toastId = Toast.Add.promise(promise, {
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
                return t("settings.successes.Bot deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Flex items="center" justify="between" border rounded="md" py="2" px="3" gap="4">
            <Flex items="center" gap="2" w="full">
                <Form.Root>
                    <BotAvatar bot={bot} />
                </Form.Root>
                <Box w="full">
                    <BotName bot={bot} />
                    <BotUniqueName bot={bot} />
                </Box>
            </Flex>
            <Box>
                <Button variant="destructive" size="icon-sm" disabled={isValidating} onClick={deleteBot}>
                    <IconComponent icon="trash-2" size="5" />
                </Button>
            </Box>
        </Flex>
    );
});

export default Bot;

import { Avatar, Box, Button, Flex, IconComponent, Toast } from "@/components/base";
import useDeleteBot from "@/controllers/api/settings/bots/useDeleteBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBotProps {
    bot: BotModel.TModel;
}

const Bot = memo(({ bot }: IBotProps) => {
    const [t] = useTranslation();
    const { navigateRef, isValidating, setIsValidating } = useAppSetting();
    const { mutateAsync } = useDeleteBot(bot);
    const name = bot.useField("name");
    const uname = bot.useField("bot_uname");
    const avatar = bot.useField("avatar");

    const deleteBot = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({});

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            messageRef.message = t("errors.Forbidden");
                            navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("settings.successes.Bot deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const toBotDetails = () => {
        navigateRef.current(ROUTES.SETTINGS.BOT_DETAILS(bot.uid));
    };

    return (
        <Flex
            items="center"
            justify="between"
            border
            rounded="md"
            py="2"
            px="3"
            gap="4"
            cursor="pointer"
            className="transition-all duration-200 hover:bg-accent"
            onClick={toBotDetails}
        >
            <Flex items="center" gap="2" w="full">
                <Avatar.Root>
                    <Avatar.Image src={avatar} />
                    <Avatar.Fallback>
                        <IconComponent icon="bot" className="size-2/3" />
                    </Avatar.Fallback>
                </Avatar.Root>
                <Box w="full">
                    <Box>{name}</Box>
                    <Box w="full" textSize="sm">
                        {uname}
                    </Box>
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

import { Avatar, Box, Button, Flex, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteBot from "@/controllers/api/settings/bots/useDeleteBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBotProps {
    bot: BotModel.TModel;
}

const Bot = memo(({ bot }: IBotProps) => {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating, setIsValidating } = useAppSetting();
    const { mutateAsync } = useDeleteBot(bot, { interceptToast: true });
    const [isOpened, setIsOpened] = useState(false);
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
                return t("successes.Bot deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const toBotDetails = () => {
        navigate(ROUTES.SETTINGS.BOT_DETAILS(bot.uid), { smooth: true });
    };

    const changeOpenState = (opened: boolean) => {
        if (isValidating) {
            return;
        }

        setIsOpened(opened);
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
            <Box
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <Popover.Root open={isOpened} onOpenChange={changeOpenState}>
                    <Popover.Trigger asChild>
                        <Button variant="destructive" size="icon-sm" title={t("common.Delete")} titleSide="bottom" disabled={isValidating}>
                            <IconComponent icon="trash-2" size="5" />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content align="end">
                        <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                            {t("ask.Are you sure you want to delete this bot?")}
                        </Box>
                        <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                            {t("common.deleteDescriptions.All data will be lost.")}
                        </Box>
                        <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                            {t("common.deleteDescriptions.This action cannot be undone.")}
                        </Box>
                        <Flex items="center" justify="end" gap="1" mt="2">
                            <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                                {t("common.Cancel")}
                            </Button>
                            <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteBot} isValidating={isValidating}>
                                {t("common.Delete")}
                            </SubmitButton>
                        </Flex>
                    </Popover.Content>
                </Popover.Root>
            </Box>
        </Flex>
    );
});

export default Bot;

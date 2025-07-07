import { Avatar, Box, Button, Flex, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteInternalBot from "@/controllers/api/settings/internalBots/useDeleteInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { InternalBotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IInternalBotProps {
    internalBot: InternalBotModel.TModel;
}

const InternalBot = memo(({ internalBot }: IInternalBotProps) => {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating, setIsValidating } = useAppSetting();
    const { mutateAsync } = useDeleteInternalBot(internalBot, { interceptToast: true });
    const [isOpened, setIsOpened] = useState(false);
    const displayName = internalBot.useField("display_name");
    const botType = internalBot.useField("bot_type");
    const avatar = internalBot.useField("avatar");
    const isDefault = internalBot.useField("is_default");

    const deleteInternalBot = (e: React.MouseEvent<HTMLButtonElement>) => {
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
                return t("successes.Internal bot deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const toInternalBotDetails = () => {
        navigate(ROUTES.SETTINGS.INTERNAL_BOT_DETAILS(internalBot.uid), { smooth: true });
    };

    const changeOpenState = (opened: bool) => {
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
            onClick={toInternalBotDetails}
        >
            <Flex items="center" gap="2" w="full">
                <Avatar.Root>
                    <Avatar.Image src={avatar} />
                    <Avatar.Fallback>
                        <IconComponent icon="bot" className="size-2/3" />
                    </Avatar.Fallback>
                </Avatar.Root>
                <Box w="full">
                    <Box>{displayName}</Box>
                    <Box w="full" textSize="sm">
                        {t(`internalBot.botTypes.${botType}`)}
                    </Box>
                </Box>
            </Flex>
            <Box
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                {isDefault ? (
                    <span className="text-secondary-foreground/50">{isDefault ? ` (${t("common.default")})` : ""}</span>
                ) : (
                    <Popover.Root open={isOpened} onOpenChange={changeOpenState}>
                        <Popover.Trigger asChild>
                            <Button variant="destructive" size="icon-sm" title={t("common.Delete")} titleSide="bottom" disabled={isValidating}>
                                <IconComponent icon="trash-2" size="5" />
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content align="end">
                            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                                {t("ask.Are you sure you want to delete this internal bot?")}
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
                                <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteInternalBot} isValidating={isValidating}>
                                    {t("common.Delete")}
                                </SubmitButton>
                            </Flex>
                        </Popover.Content>
                    </Popover.Root>
                )}
            </Box>
        </Flex>
    );
});

export default InternalBot;

import { Avatar, Box, Button, Flex, IconComponent, Toast } from "@/components/base";
import useDeleteInternalBot from "@/controllers/api/settings/internalBots/useDeleteInternalBot";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { InternalBotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IInternalBotProps {
    internalBot: InternalBotModel.TModel;
}

const InternalBot = memo(({ internalBot }: IInternalBotProps) => {
    const [t] = useTranslation();
    const { navigateRef, isValidating, setIsValidating } = useAppSetting();
    const { mutateAsync } = useDeleteInternalBot(internalBot, { interceptToast: true });
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
                            after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("settings.successes.Internal bot deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const toInternalBotDetails = () => {
        navigateRef.current(ROUTES.SETTINGS.INTERNAL_BOT_DETAILS(internalBot.uid));
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
            <Box>
                {isDefault ? (
                    <span className="text-secondary-foreground/50">{isDefault ? ` (${t("common.default")})` : ""}</span>
                ) : (
                    <Button variant="destructive" size="icon-sm" disabled={isValidating} onClick={deleteInternalBot}>
                        <IconComponent icon="trash-2" size="5" />
                    </Button>
                )}
            </Box>
        </Flex>
    );
});

export default InternalBot;

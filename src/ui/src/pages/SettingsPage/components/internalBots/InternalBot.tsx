import { Avatar, Box, Flex, IconComponent } from "@/components/base";
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
    const { navigateRef } = useAppSetting();
    const displayName = internalBot.useField("display_name");
    const botType = internalBot.useField("bot_type");
    const avatar = internalBot.useField("avatar");

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
                        {t(`settings.botTypes.${botType}`)}
                    </Box>
                </Box>
            </Flex>
        </Flex>
    );
});

export default InternalBot;

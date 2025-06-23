import { Avatar, Box, Flex, IconComponent, Select, Toast } from "@/components/base";
import useChangeProjectInternalBot from "@/controllers/api/board/settings/useChangeProjectInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { InternalBotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

interface IBoardSettingsInternalBottProps {
    internalBot: InternalBotModel.TModel;
}

const BoardSettingsInternalBot = memo(({ internalBot }: IBoardSettingsInternalBottProps) => {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const internalBots = InternalBotModel.Model.useModels((model) => model.bot_type === internalBot.bot_type);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useChangeProjectInternalBot(project.uid);

    const handleValueChange = (value: string) => {
        if (isValidating || value === internalBot.uid) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            internal_bot_uid: value,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("project.settings.successes.Internal bot changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Box weight="semibold" textSize="base">
                {t(`internalBot.botTypes.${internalBot.bot_type}`)}
            </Box>
            <Select.Root value={internalBot.uid} onValueChange={handleValueChange}>
                <Select.Trigger>
                    <Select.Value />
                </Select.Trigger>
                <Select.Content>
                    {internalBots.map((bot) => (
                        <Select.Item key={`board-settings-internal-bot-select-${bot.uid}`} value={bot.uid}>
                            <BoardSettingsInternalBotItem internalBot={bot} />
                        </Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
        </Box>
    );
});

const BoardSettingsInternalBotItem = memo(({ internalBot }: IBoardSettingsInternalBottProps) => {
    const displayName = internalBot.useField("display_name");
    const avatar = internalBot.useField("avatar");

    return (
        <Flex items="center" gap="2">
            <Avatar.Root size="xs">
                <Avatar.Image src={avatar} />
                <Avatar.Fallback>
                    <IconComponent icon="bot" className="h-[80%] w-[80%]" />
                </Avatar.Fallback>
            </Avatar.Root>
            <span className="truncate">{displayName}</span>
        </Flex>
    );
});

export default BoardSettingsInternalBot;

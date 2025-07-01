import { Avatar, Box, Flex, IconComponent, Select, Toast } from "@/components/base";
import useChangeProjectInternalBot from "@/controllers/api/board/settings/useChangeProjectInternalBot";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { InternalBotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface IBoardSettingsInternalBotProps {
    botType: InternalBotModel.EInternalBotType;
}

const BoardSettingsInternalBot = memo(({ botType }: IBoardSettingsInternalBotProps) => {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const internalBots = InternalBotModel.Model.useModels((model) => model.bot_type === botType);
    const projectInternalBots = project.useForeignField("internal_bots");
    const currentInternalBot = useMemo(
        () => projectInternalBots.find((model) => model.bot_type === botType) ?? internalBots[0],
        [projectInternalBots, botType]
    );
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useChangeProjectInternalBot(project.uid);

    const handleValueChange = (value: string) => {
        if (isValidating || value === currentInternalBot.uid) {
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
                return t("successes.Internal bot changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box>
            <Box weight="semibold" textSize="base">
                {t(`internalBot.botTypes.${botType}`)}
            </Box>
            <Select.Root value={currentInternalBot.uid} onValueChange={handleValueChange}>
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

interface IBoardSettingsInternalBotItemProps {
    internalBot: InternalBotModel.TModel;
}

const BoardSettingsInternalBotItem = memo(({ internalBot }: IBoardSettingsInternalBotItemProps) => {
    const displayName = internalBot.useField("display_name");
    const avatar = internalBot.useField("avatar");

    return (
        <Flex items="center" gap="2">
            <Avatar.Root size="xs">
                <Avatar.Image src={avatar} />
                <Avatar.Fallback>
                    <IconComponent icon="bot" className="size-[80%]" />
                </Avatar.Fallback>
            </Avatar.Root>
            <span className="truncate">{displayName}</span>
        </Flex>
    );
});

export default BoardSettingsInternalBot;

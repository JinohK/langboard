import { Button, Checkbox, Flex, Label, Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import useToggleProjectBotActivation from "@/controllers/api/board/settings/useToggleProjectBotActivation";
import useUpdateProjectBotRoles from "@/controllers/api/board/settings/useUpdateProjectBotRoles";
import useBoardBotActivationToggledHandlers from "@/controllers/socket/board/settings/useBoardBotActivationToggledHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { BotModel, Project, User } from "@/core/models";
import { ROLE_ALL_GRANTED } from "@/core/models/Base";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsBotRoleProps {
    bot: BotModel.TModel;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardSettingsBotRole = memo(({ bot, isValidating, setIsValidating }: IBoardSettingsBotRoleProps) => {
    const [t] = useTranslation();
    const { socket, project } = useBoardSettings();
    const botRoles = project.useField("bot_roles");
    const roles = botRoles[bot.uid];
    const { mutateAsync: updateProjectBotRolesMutateAsync } = useUpdateProjectBotRoles(bot.uid);
    const { mutateAsync: toggleProjectBotActivationMutateAsync } = useToggleProjectBotActivation();
    const botAsUser = bot.useForeignField<User.TModel>("as_user")[0];
    const [isDisabled, setIsDisabled] = useState(false);
    const updateRole = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (isValidating || isDisabled) {
                return;
            }

            const role: Project.ERoleAction = e.currentTarget.getAttribute("data-value") as Project.ERoleAction;

            setIsValidating(true);

            const newRoles = roles.includes(ROLE_ALL_GRANTED) ? Object.values(Project.ERoleAction) : [...roles];

            const promise = updateProjectBotRolesMutateAsync({
                project_uid: project.uid,
                roles: newRoles.includes(role) ? newRoles.filter((r) => r !== role) : [...newRoles, role],
            });

            Toast.Add.promise(promise, {
                loading: t("common.Updating..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler({}, messageRef);

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("project.settings.successes.Bot roles updated successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                },
            });
        },
        [isValidating, isDisabled, botRoles]
    );
    const boardBotActivationToggledHandlers = useMemo(
        () =>
            useBoardBotActivationToggledHandlers({
                projectUID: project.uid,
                callback: (data) => {
                    if (data.bot_uid !== bot.uid) {
                        return;
                    }
                    setIsDisabled(() => data.is_disabled);
                },
            }),
        [setIsDisabled]
    );
    useSwitchSocketHandlers({ socket, handlers: [boardBotActivationToggledHandlers], dependencies: [boardBotActivationToggledHandlers] });

    const toggleActivation = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = toggleProjectBotActivationMutateAsync({
            project_uid: project.uid,
            bot_uid: bot.uid,
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
                return t(`project.settings.successes.Bot ${isDisabled ? "enabled" : "disabled"} successfully.`);
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    if (!roles) {
        return null;
    }

    return (
        <Flex items="center" justify="between" gap="3">
            <Flex items="center" gap="1">
                <UserAvatar.Root user={botAsUser} avatarSize="xs" withName labelClassName="inline-flex gap-1 select-none" nameClassName="text-base">
                    <UserAvatarDefaultList user={botAsUser} projectUID={project.uid} />
                </UserAvatar.Root>
                <Button size="sm" onClick={toggleActivation} disabled={isValidating}>
                    {t(`project.settings.${isDisabled ? "Enable" : "Disable"}`)}
                </Button>
            </Flex>

            <Flex wrap gap="2">
                {Object.keys(Project.ERoleAction).map((key) => {
                    const disabled = key.toLowerCase() === Project.ERoleAction.Read || isValidating || isDisabled;
                    return (
                        <Label
                            display="flex"
                            items="center"
                            key={`board-bot-role-${bot.uid}-${key}`}
                            className={!disabled ? "cursor-pointer" : "cursor-not-allowed"}
                        >
                            <Checkbox
                                checked={roles.includes(Project.ERoleAction[key]) || roles.includes(ROLE_ALL_GRANTED)}
                                disabled={disabled}
                                data-value={Project.ERoleAction[key]}
                                className="mr-1"
                                onClick={updateRole}
                            />
                            {t(`role.project.${Project.ERoleAction[key]}`)}
                        </Label>
                    );
                })}
            </Flex>
        </Flex>
    );
});

export default BoardSettingsBotRole;

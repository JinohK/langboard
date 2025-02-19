import { Checkbox, Flex, Label, Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import useUpdateProjectBotRoles from "@/controllers/api/board/settings/useUpdateProjectBotRoles";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, Project } from "@/core/models";
import { ROLE_ALL_GRANTED } from "@/core/models/Base";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsBotRoleProps {
    bot: BotModel.TModel;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
    isValidatingRef: React.RefObject<bool>;
}

const BoardSettingsBotRole = memo(({ bot, isValidating, setIsValidating, isValidatingRef }: IBoardSettingsBotRoleProps) => {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const botRoles = project.useField("bot_roles");
    const roles = botRoles[bot.uid];
    const { mutateAsync } = useUpdateProjectBotRoles(bot.uid);

    if (!roles) {
        return null;
    }

    const updateRole = (role: Project.ERoleAction) => {
        if (isValidatingRef.current) {
            return;
        }

        setIsValidating(true);
        isValidatingRef.current = true;

        const newRoles = roles.includes(ROLE_ALL_GRANTED) ? Object.values(Project.ERoleAction) : [...roles];

        const promise = mutateAsync({
            project_uid: project.uid,
            roles: newRoles.includes(role) ? newRoles.filter((r) => r !== role) : [...newRoles, role],
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                    },
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("project.errors.Project not found.");
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
                return t("project.settings.successes.Bot roles updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                isValidatingRef.current = false;
            },
        });
    };

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root user={bot.as_user} avatarSize="xs" withName labelClassName="inline-flex gap-1 select-none" nameClassName="text-base">
                <UserAvatar.List>
                    <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                </UserAvatar.List>
            </UserAvatar.Root>
            <Flex wrap gap="2">
                {Object.keys(Project.ERoleAction).map((key) => {
                    const disabled = key.toLowerCase() === Project.ERoleAction.Read || isValidating;
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
                                className="mr-1"
                                onClick={() => updateRole(Project.ERoleAction[key])}
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

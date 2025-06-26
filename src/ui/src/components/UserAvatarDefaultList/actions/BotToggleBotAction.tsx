import { Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import useToggleProjectBotActivation from "@/controllers/api/board/settings/useToggleProjectBotActivation";
import useProjectBotActivationToggledHandlers from "@/controllers/socket/projectBot/useProjectBotActivationToggledHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { BotModel, Project } from "@/core/models";
import { useUserAvatar } from "@/core/providers/UserAvatarProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IUserAvatarDefaultBotToggleActionProps {
    bot: BotModel.TModel;
    project: Project.TModel;
}

function UserAvatarDefaultBotToggleAction({ bot, project }: IUserAvatarDefaultBotToggleActionProps): JSX.Element {
    const { socket, setIsBotDisabled, isBotDisabled } = useUserAvatar();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: toggleProjectBotActivationMutateAsync } = useToggleProjectBotActivation({ interceptToast: true });
    const toggle = useCallback(() => {
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
                return t(`successes.Bot ${isBotDisabled ? "enabled" : "disabled"} successfully.`);
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    }, [isValidating, isBotDisabled]);
    const projectBotActivationToggledHandlers = useMemo(
        () =>
            useProjectBotActivationToggledHandlers({
                projectUID: project.uid,
                botUID: bot.uid,
                callback: (data) => {
                    setIsBotDisabled(() => data.is_disabled);
                },
            }),
        [setIsBotDisabled]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [projectBotActivationToggledHandlers],
        dependencies: [projectBotActivationToggledHandlers],
    });

    if (TypeUtils.isNullOrUndefined(isBotDisabled)) {
        return <></>;
    }

    return (
        <>
            <UserAvatar.ListItem onClick={toggle}>
                {t(`common.avatarActions.${isBotDisabled ? "Enable" : "Disable"} from this project`)}
            </UserAvatar.ListItem>
            <UserAvatar.ListSeparator />
        </>
    );
}

export default UserAvatarDefaultBotToggleAction;

import { Box, Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import UserAvatar, { getAvatarHoverCardAttrs } from "@/components/UserAvatar";
import useUnassignProjectAssignee from "@/controllers/api/board/useUnassignProjectAssignee";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User } from "@/core/models";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IUserAvatarDefaultUnassignActionProps {
    user: User.TModel;
    project: Project.TModel;
    setIsAssignee: React.Dispatch<React.SetStateAction<bool>>;
}

function UserAvatarDefaultUnassignAction({ user, project, setIsAssignee }: IUserAvatarDefaultUnassignActionProps): JSX.Element {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: unassignProjectAssigneeMutateAsync } = useUnassignProjectAssignee();

    const unassign = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = unassignProjectAssigneeMutateAsync({
            project_uid: project.uid,
            assignee_uid: user.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
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
                setIsAssignee(() => false);
                return t("board.successes.Unassigned successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Popover.Root modal={false} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <UserAvatar.ListItem>{t("common.avatarActions.Unassign from this project")}</UserAvatar.ListItem>
            </Popover.Trigger>
            <Popover.Content className="z-[999999]" {...getAvatarHoverCardAttrs(user)}>
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("board.Are you sure you want to unassign this assignee?")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.settings.All data will be lost.")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.settings.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" onClick={() => setIsOpened(false)} size="sm" disabled={isValidating}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={unassign} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default UserAvatarDefaultUnassignAction;

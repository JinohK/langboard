import { Checkbox, Flex, Label, Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import useUpdateProjectUserRoles from "@/controllers/api/board/settings/useUpdateProjectUserRoles";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsRoleProps {
    member: User.TModel;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardSettingsRole = memo(({ member, isValidating, setIsValidating }: IBoardSettingsRoleProps) => {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const memberRoles = project.useField("member_roles");
    const roles = memberRoles[member.uid];
    const { mutateAsync } = useUpdateProjectUserRoles(member.uid);

    const updateRole = (role: Project.ERoleAction) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            project_uid: project.uid,
            roles: roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role],
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
                return t("project.settings.successes.Member roles updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root user={member} avatarSize="xs" withName labelClassName="inline-flex gap-1 select-none" nameClassName="text-base">
                <UserAvatar.List>
                    <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                </UserAvatar.List>
            </UserAvatar.Root>
            <Flex wrap gap="2">
                {Object.keys(Project.ERoleAction).map((key) => {
                    const disabled = key === "Read" || isValidating;
                    return (
                        <Label
                            display="flex"
                            items="center"
                            key={`board-member-role-${member.uid}-${key}`}
                            className={!disabled ? "cursor-pointer" : "cursor-not-allowed"}
                        >
                            <Checkbox
                                checked={roles.includes(Project.ERoleAction[key])}
                                disabled={disabled}
                                className="mr-1"
                                onClick={() => updateRole(Project.ERoleAction[key])}
                            />
                            {t(`roles.project.${Project.ERoleAction[key]}`)}
                        </Label>
                    );
                })}
            </Flex>
        </Flex>
    );
});

export default BoardSettingsRole;

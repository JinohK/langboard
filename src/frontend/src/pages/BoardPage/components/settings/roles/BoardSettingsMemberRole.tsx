import { Checkbox, Flex, Label, Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import useUpdateProjectUserRoles from "@/controllers/api/board/settings/useUpdateProjectUserRoles";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, User } from "@/core/models";
import { ROLE_ALL_GRANTED } from "@/core/models/Base";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsMemberRoleProps {
    member: User.TModel;
    isValidating: bool;
    setIsValidating: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardSettingsMemberRole = memo(({ member, isValidating, setIsValidating }: IBoardSettingsMemberRoleProps) => {
    const [t] = useTranslation();
    const { project } = useBoardSettings();
    const memberRoles = project.useField("member_roles");
    const roles = memberRoles[member.uid];
    const { mutateAsync } = useUpdateProjectUserRoles(member.uid);
    const updateRole = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (isValidating) {
                return;
            }

            const role: Project.ERoleAction = e.currentTarget.getAttribute("data-value") as Project.ERoleAction;

            setIsValidating(true);

            const newRoles = roles.includes(ROLE_ALL_GRANTED) ? Object.values(Project.ERoleAction) : [...roles];

            const promise = mutateAsync({
                project_uid: project.uid,
                roles: newRoles.includes(role) ? newRoles.filter((r) => r !== role) : [...newRoles, role],
            });

            Toast.Add.promise(promise, {
                loading: t("common.Updating..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                            [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("project.errors.Project not found."),
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("project.settings.successes.Member roles updated successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                },
            });
        },
        [isValidating, setIsValidating, memberRoles]
    );

    if (!roles) {
        return null;
    }

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root user={member} avatarSize="xs" withName labelClassName="inline-flex gap-1 select-none" nameClassName="text-base">
                <UserAvatarDefaultList user={member} projectUID={project.uid} />
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

export default BoardSettingsMemberRole;

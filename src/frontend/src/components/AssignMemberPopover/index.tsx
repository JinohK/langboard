import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button, ButtonProps, DropdownMenu, Flex, IconComponent, Popover } from "@/components/base";
import UserAvatarList, { IUserAvatarListProps, SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { IAuthUser, useAuth } from "@/core/providers/AuthProvider";
import { TIconProps } from "@/components/base/IconComponent";
import { User } from "@/core/models";
import MultiSelect, { IMultiSelectProps } from "@/components/MultiSelect";
import UserAvatar from "@/components/UserAvatar";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";
import SubmitButton from "@/components/SubmitButton";

export interface IAssignMemberPopoverProps {
    popoverButtonProps: ButtonProps;
    popoverContentProps?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
    userAvatarListProps: Omit<IUserAvatarListProps, "users">;
    multiSelectProps: Pick<IMultiSelectProps, "selectedState" | "placeholder" | "className" | "badgeClassName" | "inputClassName">;
    allUsers: User.Interface[];
    assignedUsers: User.Interface[];
    isValidating: bool;
    onSave: (users: User.Interface[], endCallback: () => void) => void;
    iconSize?: React.ComponentPropsWithoutRef<TIconProps>["size"];
    currentUser?: IAuthUser;
    canRemoveAlreadyAssigned?: bool;
}

export const AssignMemberPopover = memo(
    ({
        popoverButtonProps,
        popoverContentProps,
        userAvatarListProps,
        multiSelectProps,
        allUsers,
        assignedUsers,
        isValidating,
        onSave,
        iconSize = "4",
        currentUser,
        canRemoveAlreadyAssigned,
    }: IAssignMemberPopoverProps) => {
        const [t] = useTranslation();
        const { aboutMe } = useAuth();
        const [isOpened, setIsOpened] = useState(false);
        const [selected, setSelected] = multiSelectProps.selectedState;
        const { variant = "outline" } = popoverButtonProps;
        const user = currentUser ?? aboutMe();
        const save = () => {
            const users = allUsers.filter((user) => selected.includes(user.id.toString()));
            onSave(users, () => {
                setSelected([]);
                setIsOpened(false);
            });
        };

        if (!user) {
            return (
                <SkeletonUserAvatarList
                    count={userAvatarListProps.maxVisible}
                    size={userAvatarListProps.size}
                    spacing={userAvatarListProps.spacing}
                />
            );
        }

        return (
            <Flex items="center" gap="1">
                {assignedUsers.length > 0 && <UserAvatarList users={assignedUsers} {...userAvatarListProps} />}
                <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpened}>
                    <Popover.Trigger asChild>
                        <Button variant={variant} {...popoverButtonProps}>
                            <IconComponent icon="plus" size={iconSize} />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content {...popoverContentProps}>
                        <AssignMemberForm
                            multiSelectProps={multiSelectProps}
                            allUsers={allUsers}
                            assignedUsers={assignedUsers}
                            isValidating={isValidating}
                            currentUser={user}
                            canRemoveAlreadyAssigned={canRemoveAlreadyAssigned}
                        />
                        <Flex items="center" justify="end" gap="1" mt="2">
                            <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                                {t("common.Cancel")}
                            </Button>
                            <SubmitButton type="button" size="sm" onClick={() => save()} isValidating={isValidating}>
                                {t("common.Save")}
                            </SubmitButton>
                        </Flex>
                    </Popover.Content>
                </Popover.Root>
            </Flex>
        );
    }
);

export interface IAssignMemberFormProps
    extends Omit<IAssignMemberPopoverProps, "popoverButtonProps" | "popoverContentProps" | "userAvatarListProps" | "onSave" | "iconSize"> {}

export const AssignMemberForm = memo(
    ({ multiSelectProps, allUsers, assignedUsers, isValidating, currentUser, canRemoveAlreadyAssigned }: IAssignMemberFormProps) => {
        const [t] = useTranslation();
        const { aboutMe } = useAuth();
        const [selected, setSelected] = multiSelectProps.selectedState;
        const user = currentUser ?? aboutMe();
        const [isDropdownOpened, setIsDropdownOpened] = useState(false);
        const assignableGroups = useMemo(() => {
            if (!user) {
                return [];
            }

            return user.user_groups
                .map((group) => {
                    const groupMembers = group.users.filter(
                        (member) =>
                            (canRemoveAlreadyAssigned || !assignedUsers.some((assigned) => assigned.id === member.id)) &&
                            selected.indexOf(member.id.toString()) === -1 &&
                            allUsers.some((user) => user.id === member.id)
                    );

                    if (!groupMembers.length) {
                        return null;
                    }

                    return { id: group.id, name: group.name, members: groupMembers };
                })
                .filter((group) => group !== null);
        }, [assignedUsers, selected, allUsers]);
        const addGroupMembers = useCallback(
            (groupId: number) => {
                const group = assignableGroups.find((group) => group.id === groupId);
                if (!group) {
                    return;
                }

                setSelected((prev) => [...prev, ...group.members.map((member) => member.id.toString())]);
            },
            [assignableGroups]
        );

        useEffect(() => {
            if (canRemoveAlreadyAssigned && !selected.length) {
                setSelected(assignedUsers.map((member) => member.id.toString()));
            }
        }, []);

        return (
            <>
                <MultiSelect
                    selections={allUsers
                        .filter((member) => canRemoveAlreadyAssigned || !assignedUsers.some((assigned) => assigned.id === member.id))
                        .map((member) => ({
                            value: member.id.toString(),
                            label: `${member.firstname} ${member.lastname}`,
                        }))}
                    createBadgeWrapper={(badge, value) => (
                        <UserAvatar.Root user={allUsers.find((member) => member.id.toString() === value)!} customTrigger={badge}>
                            test
                        </UserAvatar.Root>
                    )}
                    disabled={isValidating}
                    {...multiSelectProps}
                />
                <DropdownMenu.Root open={isDropdownOpened} onOpenChange={setIsDropdownOpened}>
                    <DropdownMenu.Trigger asChild>
                        <Button variant="secondary" size="sm" disabled={!assignableGroups.length || isValidating}>
                            {t("common.Add members from group")}
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Group>
                            {assignableGroups.map((group) => (
                                <DropdownMenu.Item key={`group-${group.name}-${createShortUUID()}`} onClick={() => addGroupMembers(group.id)}>
                                    {group.name}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Group>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </>
        );
    }
);

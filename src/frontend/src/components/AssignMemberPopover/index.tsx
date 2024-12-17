import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button, ButtonProps, DropdownMenu, Flex, IconComponent, Popover } from "@/components/base";
import UserAvatarList, { IUserAvatarListProps, SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IAuthUser, useAuth } from "@/core/providers/AuthProvider";
import { TIconProps } from "@/components/base/IconComponent";
import { User } from "@/core/models";
import MultiSelect, { TMultiSelectProps } from "@/components/MultiSelect";
import UserAvatar from "@/components/UserAvatar";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";
import SubmitButton from "@/components/SubmitButton";
import { EMAIL_REGEX } from "@/constants";

export interface IAssignMemberPopoverProps {
    popoverButtonProps: ButtonProps;
    popoverContentProps?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
    userAvatarListProps: Omit<IUserAvatarListProps, "users">;
    multiSelectProps: Pick<TMultiSelectProps, "placeholder" | "className" | "badgeClassName" | "inputClassName">;
    allUsers: User.Interface[];
    assignedUsers: User.Interface[];
    newUsers?: User.Interface[];
    isValidating: bool;
    onSave: (users: User.Interface[], endCallback: () => void) => void;
    iconSize?: React.ComponentPropsWithoutRef<TIconProps>["size"];
    currentUser?: IAuthUser;
    canControlAssignedUsers?: bool;
    canAssignNonMembers?: bool;
}

const getAllUsers = (allUsers: User.Interface[], groups: IAuthUser["user_groups"], newUsers: User.Interface[], canAssignNonMembers?: bool) => {
    const users = [...allUsers];
    if (canAssignNonMembers) {
        users.push(...newUsers);
        const groupUsers = groups.map((group) => group.users).flat();
        for (let i = 0; i < groupUsers.length; ++i) {
            if (!users.some((user) => user.email === groupUsers[i].email)) {
                users.push(groupUsers[i]);
            }
        }
    }

    return users;
};

export const AssignMemberPopover = memo(
    ({
        popoverButtonProps,
        popoverContentProps,
        userAvatarListProps,
        multiSelectProps,
        allUsers: flatAllUsers,
        assignedUsers,
        newUsers: flatNewUsers,
        isValidating,
        onSave,
        iconSize = "4",
        currentUser,
        canControlAssignedUsers,
        canAssignNonMembers,
    }: IAssignMemberPopoverProps) => {
        const [t] = useTranslation();
        const { aboutMe } = useAuth();
        const [isOpened, setIsOpened] = useState(false);
        const newUsers = useMemo<User.Interface[]>(() => (canAssignNonMembers ? (flatNewUsers ?? []) : []), [flatNewUsers]);
        const selectedRef = useRef<string[]>([
            ...(canControlAssignedUsers ? assignedUsers.map((user) => user.email) : []),
            ...(canAssignNonMembers ? newUsers.map((user) => user.email) : []),
        ]);
        const { variant = "outline" } = popoverButtonProps;
        const user = currentUser ?? aboutMe();
        const [allUsers, setAllUsers] = useState<User.Interface[]>(getAllUsers(flatAllUsers, user?.user_groups ?? [], newUsers, canAssignNonMembers));
        const setIsOpenedState = (state: bool) => {
            selectedRef.current = [];
            setIsOpened(state);
        };
        const save = () => {
            const users = allUsers.filter((user) => selectedRef.current.includes(user.email));
            onSave(users, () => {
                setIsOpenedState(false);
            });
        };
        const onValueChange = (value: string[]) => {
            selectedRef.current = value;
            for (let i = 0; i < value.length; ++i) {
                if (!allUsers.some((user) => user.email === value[i])) {
                    newUsers.push(User.createNoneEmailUser(value[i]));
                }
            }
            setAllUsers(getAllUsers(flatAllUsers, user?.user_groups ?? [], newUsers, canAssignNonMembers));
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
                <Popover.Root modal={true} open={isOpened} onOpenChange={setIsOpenedState}>
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
                            newUsers={newUsers}
                            isValidating={isValidating}
                            currentUser={user}
                            canControlAssignedUsers={canControlAssignedUsers}
                            canAssignNonMembers={canAssignNonMembers}
                            onValueChange={onValueChange}
                        />
                        <Flex items="center" justify="end" gap="1" mt="2">
                            <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpenedState(false)}>
                                {t("common.Cancel")}
                            </Button>
                            <SubmitButton type="button" size="sm" onClick={save} isValidating={isValidating}>
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
    extends Omit<IAssignMemberPopoverProps, "popoverButtonProps" | "popoverContentProps" | "userAvatarListProps" | "onSave" | "iconSize"> {
    onValueChange: TMultiSelectProps["onValueChange"];
}

export const AssignMemberForm = memo(
    ({
        multiSelectProps,
        allUsers,
        assignedUsers,
        newUsers,
        isValidating,
        currentUser,
        canControlAssignedUsers,
        canAssignNonMembers,
        onValueChange,
    }: IAssignMemberFormProps) => {
        const [t] = useTranslation();
        const { aboutMe } = useAuth();
        const [selected, setSelected] = useState<string[]>([
            ...(canControlAssignedUsers && assignedUsers.length ? assignedUsers.map((user) => user.email) : []),
            ...(canAssignNonMembers && newUsers ? newUsers.map((user) => user.email) : []),
        ]);
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
                            (canControlAssignedUsers || !assignedUsers.some((assigned) => assigned.email === member.email)) &&
                            (canAssignNonMembers ||
                                (!User.isPresentableUnknownUser(member) && allUsers.some((user) => user.email === member.email))) &&
                            selected.indexOf(member.email) === -1
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

                setSelected((prev) => [
                    ...prev,
                    ...group.members.filter((member) => canAssignNonMembers || !User.isPresentableUnknownUser(member)).map((member) => member.email),
                ]);
            },
            [assignableGroups]
        );

        useEffect(() => {
            if (canControlAssignedUsers && !selected.length) {
                setSelected(assignedUsers.map((member) => member.email));
            }
        }, []);

        const onSelected = (value: string[]) => {
            onValueChange?.(value);
            setSelected(value);
        };

        const validateCreatedNewValue = (value: string) => {
            return EMAIL_REGEX.test(value);
        };

        return (
            <>
                <MultiSelect
                    selections={allUsers
                        .filter(
                            (member) =>
                                (canControlAssignedUsers || !assignedUsers.some((assigned) => assigned.email === member.email)) &&
                                (canAssignNonMembers || !User.isPresentableUnknownUser(member))
                        )
                        .map((member) => ({
                            value: member.email,
                            label: `${member.firstname} ${member.lastname}`,
                        }))}
                    selectedValue={selected}
                    createBadgeWrapper={(badge, value) => {
                        let user = allUsers.find((member) => member.email === value);
                        if (!user && canAssignNonMembers) {
                            user = User.createNoneEmailUser(value);
                        }
                        user = { ...user! };

                        return (
                            <UserAvatar.Root user={user!} customTrigger={badge}>
                                test
                            </UserAvatar.Root>
                        );
                    }}
                    disabled={isValidating}
                    onValueChange={onSelected}
                    canCreateNew={canAssignNonMembers as bool}
                    validateCreatedNewValue={validateCreatedNewValue as never}
                    commandItemForNew={((value: string) => t("common.Assign '{email}'", { email: value })) as never}
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

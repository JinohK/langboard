import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button, ButtonProps, DropdownMenu, Flex, IconComponent, Popover, SubmitButton } from "@/components/base";
import UserAvatarList, { IUserAvatarListProps, SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/core/providers/AuthProvider";
import { TIconProps } from "@/components/base/IconComponent";
import { AuthUser, User } from "@/core/models";
import MultiSelect, { TMultiSelectProps } from "@/components/MultiSelect";
import UserAvatar from "@/components/UserAvatar";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";
import { EMAIL_REGEX } from "@/constants";

export interface IMultiSelectMemberPopoverProps {
    popoverButtonProps: ButtonProps;
    popoverContentProps?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
    userAvatarListProps: Omit<IUserAvatarListProps, "users">;
    multiSelectProps: Pick<
        TMultiSelectProps,
        "placeholder" | "className" | "badgeClassName" | "inputClassName" | "validateCreatedNewValue" | "commandItemForNew" | "multipleSplitter"
    >;
    allUsers: User.TModel[];
    assignedUsers: User.TModel[];
    newUsers?: User.TModel[];
    isValidating: bool;
    onSave: (users: User.TModel[], endCallback: () => void) => void;
    iconSize?: React.ComponentPropsWithoutRef<TIconProps>["size"];
    currentUser?: AuthUser.TModel;
    canControlAssignedUsers?: bool;
    canAssignNonMembers?: bool;
    useGroupMembers?: bool;
    setSelectedRef?: React.MutableRefObject<React.Dispatch<React.SetStateAction<string[]>>>;
    createNewUserLabel?: (user: User.TModel) => string;
}

const getAllUsers = (allUsers: User.TModel[], groups: AuthUser.TModel["user_groups"], newUsers: User.TModel[], canAssignNonMembers?: bool) => {
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

export const MultiSelectMemberPopover = memo(
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
        useGroupMembers,
        setSelectedRef,
        createNewUserLabel,
    }: IMultiSelectMemberPopoverProps) => {
        const [t] = useTranslation();
        const { aboutMe } = useAuth();
        const [isOpened, setIsOpened] = useState(false);
        const newUsers = useMemo<User.TModel[]>(() => (canAssignNonMembers ? (flatNewUsers ?? []) : []), [flatNewUsers]);
        const selectedRef = useRef<string[]>([
            ...(canControlAssignedUsers ? assignedUsers.map((user) => user.email) : []),
            ...(canAssignNonMembers ? newUsers.map((user) => user.email) : []),
        ]);
        const { variant = "outline" } = popoverButtonProps;
        const user = currentUser ?? aboutMe();
        const [allUsers, setAllUsers] = useState<User.TModel[]>(getAllUsers(flatAllUsers, user?.user_groups ?? [], newUsers, canAssignNonMembers));
        const setIsOpenedState = (state: bool) => {
            selectedRef.current = [];
            setSelectedRef?.current?.(() => []);
            if (flatNewUsers) {
                const updatedUsers = flatNewUsers.filter((user) => user instanceof User.Model);
                flatNewUsers.splice(0, flatNewUsers.length, ...updatedUsers);
            }
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
                    newUsers.push(User.Model.createTempEmailUser(value[i]));
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
                        <MultiSelectMemberForm
                            multiSelectProps={multiSelectProps}
                            allUsers={allUsers}
                            assignedUsers={assignedUsers}
                            newUsers={newUsers}
                            isValidating={isValidating}
                            currentUser={user}
                            canControlAssignedUsers={canControlAssignedUsers}
                            canAssignNonMembers={canAssignNonMembers}
                            useGroupMembers={useGroupMembers}
                            onValueChange={onValueChange}
                            setSelectedRef={setSelectedRef}
                            createNewUserLabel={createNewUserLabel}
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

export interface IMultiSelectMemberFormProps
    extends Omit<IMultiSelectMemberPopoverProps, "popoverButtonProps" | "popoverContentProps" | "userAvatarListProps" | "onSave" | "iconSize"> {
    onValueChange: TMultiSelectProps["onValueChange"];
    useGroupMembers?: bool;
}

export const MultiSelectMemberForm = memo(
    ({
        multiSelectProps,
        allUsers,
        assignedUsers,
        newUsers,
        isValidating,
        currentUser,
        canControlAssignedUsers,
        canAssignNonMembers,
        useGroupMembers,
        setSelectedRef,
        onValueChange,
        createNewUserLabel,
    }: IMultiSelectMemberFormProps) => {
        const [t] = useTranslation();
        const { aboutMe } = useAuth();
        const [selected, setSelected] = useState<string[]>([
            ...(canControlAssignedUsers && assignedUsers.length ? assignedUsers.map((user) => user.email) : []),
            ...(canAssignNonMembers && newUsers ? newUsers.map((user) => user.email) : []),
        ]);
        if (setSelectedRef) {
            setSelectedRef.current = setSelected;
        }
        const user = currentUser ?? aboutMe();
        const [isDropdownOpened, setIsDropdownOpened] = useState(false);
        const filterSelectableUsers = useCallback(
            (member: User.TModel) => {
                return (
                    (canControlAssignedUsers || !assignedUsers.some((assigned) => assigned.email === member.email)) &&
                    (canAssignNonMembers || (!member.isPresentableUnknownUser() && allUsers.some((user) => user.email === member.email)))
                );
            },
            [canControlAssignedUsers, assignedUsers, canAssignNonMembers, allUsers]
        );
        const assignableGroups = useMemo(() => {
            if (!user) {
                return [];
            }

            return user.user_groups
                .map((group) => {
                    const groupMembers = group.users.filter((member) => filterSelectableUsers(member) && !selected.includes(member.email));

                    if (!groupMembers.length) {
                        return null;
                    }

                    return { uid: group.uid, name: group.name, members: groupMembers };
                })
                .filter((group) => group !== null);
        }, [assignedUsers, selected, allUsers]);
        const addGroupMembers = useCallback(
            (groupUID: string) => {
                const group = assignableGroups.find((group) => group.uid === groupUID);
                if (!group) {
                    return;
                }

                setSelected((prev) => [
                    ...prev,
                    ...group.members.filter((member) => canAssignNonMembers || !member.isPresentableUnknownUser()).map((member) => member.email),
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

        return (
            <>
                <MultiSelect
                    selections={allUsers
                        .filter((member) => filterSelectableUsers(member))
                        .map((member) => ({
                            value: member.email,
                            label:
                                canAssignNonMembers &&
                                newUsers?.some((user) => user.uid === member.uid) &&
                                member instanceof User.Model &&
                                createNewUserLabel
                                    ? createNewUserLabel(member)
                                    : `${member.firstname} ${member.lastname}`,
                        }))}
                    selectedValue={selected}
                    createBadgeWrapper={(badge, value) => {
                        let user = allUsers.find((member) => member.email === value);
                        if (!user && canAssignNonMembers) {
                            user = User.Model.createTempEmailUser(value);
                        }

                        if (!user) {
                            return null!;
                        }

                        return (
                            <UserAvatar.Root user={user} customTrigger={badge}>
                                test
                            </UserAvatar.Root>
                        );
                    }}
                    disabled={isValidating}
                    onValueChange={onSelected}
                    canCreateNew={canAssignNonMembers as false}
                    validateCreatedNewValue={((value: string) => EMAIL_REGEX.test(value)) as never}
                    commandItemForNew={((values: string[]) => t("common.Assign '{emails}'", { emails: values })) as never}
                    {...(multiSelectProps as Record<string, unknown>)}
                />
                {useGroupMembers && (
                    <DropdownMenu.Root open={isDropdownOpened} onOpenChange={setIsDropdownOpened}>
                        <DropdownMenu.Trigger asChild>
                            <Button variant="secondary" size="sm" disabled={!assignableGroups.length || isValidating}>
                                {t("common.Add members from group")}
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Group>
                                {assignableGroups.map((group) => (
                                    <DropdownMenu.Item key={`group-${group.name}-${createShortUUID()}`} onClick={() => addGroupMembers(group.uid)}>
                                        {group.name}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Group>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                )}
            </>
        );
    }
);

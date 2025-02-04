import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button, ButtonProps, DropdownMenu, Flex, IconComponent, Popover, SubmitButton } from "@/components/base";
import UserAvatarList, { IUserAvatarListProps } from "@/components/UserAvatarList";
import MultiSelect, { TMultiSelectProps } from "@/components/MultiSelect";
import { TIconProps } from "@/components/base/IconComponent";
import { BotModel, User, UserGroup } from "@/core/models";
import { useTranslation } from "react-i18next";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { EMAIL_REGEX } from "@/constants";
import { createShortUUID } from "@/core/utils/StringUtils";

export type TMultiSelectAssigneeItem = User.TModel | BotModel.TModel;

interface IMultiSelectAssigneesPopoverProps extends Omit<TMultiSelectAssigneesFormProps, "onValueChange"> {
    popoverButtonProps: ButtonProps;
    popoverContentProps?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
    userAvatarListProps: Omit<IUserAvatarListProps, "users">;
    addIcon?: React.ComponentPropsWithoutRef<TIconProps>["icon"];
    addIconSize?: React.ComponentPropsWithoutRef<TIconProps>["size"];
    saveText?: string;
    assignedFilter: (item: TMultiSelectAssigneeItem) => bool;
    onSave: (selectedItems: TMultiSelectAssigneeItem[], endCallback: () => void) => void;
}

export const getMultiSelectItemValue = (item: TMultiSelectAssigneeItem): string => {
    if (item instanceof BotModel.Model) {
        return item.bot_uname;
    } else {
        return item.email;
    }
};

export const getMultiSelectItemLabel = (item: TMultiSelectAssigneeItem): string => {
    if (item instanceof BotModel.Model) {
        return item.name;
    } else {
        return `${item.firstname} ${item.lastname}`.trim();
    }
};

export const getMultiSelectItemAsUser = (item: TMultiSelectAssigneeItem): User.TModel => {
    if (item instanceof BotModel.Model) {
        return item.as_user;
    } else {
        return item;
    }
};

export const MultiSelectAssigneesPopover = memo(
    ({
        popoverButtonProps,
        popoverContentProps,
        userAvatarListProps,
        addIcon = "plus",
        addIconSize,
        saveText,
        isValidating,
        allItems,
        initialSelectedItems,
        assignedFilter,
        onSave,
        createNewUserLabel,
        ...props
    }: IMultiSelectAssigneesPopoverProps) => {
        const [t] = useTranslation();
        const [isOpened, setIsOpened] = useState(false);
        const { variant: popoverButtonVariant = "outline" } = popoverButtonProps;
        const assignees = useMemo(() => allItems.filter((item) => assignedFilter(item) ?? false), [allItems, assignedFilter]);
        const selectedItemsRef = useRef<TMultiSelectAssigneeItem[]>(initialSelectedItems);

        const changeIsOpenedState = (newState: bool) => {
            setIsOpened(newState);
        };

        const save = () => {
            onSave(selectedItemsRef.current, () => changeIsOpenedState(false));
        };

        useEffect(() => {
            selectedItemsRef.current = initialSelectedItems;
        }, [initialSelectedItems]);

        return (
            <Flex items="center" gap="1">
                {assignees.length > 0 && <UserAvatarList users={assignees.map(getMultiSelectItemAsUser)} {...userAvatarListProps} />}
                <Popover.Root modal={true} open={isOpened} onOpenChange={changeIsOpenedState}>
                    <Popover.Trigger asChild>
                        <Button variant={popoverButtonVariant} {...popoverButtonProps}>
                            <IconComponent icon={addIcon} size={addIconSize} />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content {...popoverContentProps}>
                        <MultiSelectAssigneesForm
                            {...(props as IMultiSelectAssigneesFormWithNonMembersProps)}
                            isValidating={isValidating}
                            allItems={allItems}
                            initialSelectedItems={initialSelectedItems}
                            createNewUserLabel={createNewUserLabel}
                            onValueChange={(items) => {
                                selectedItemsRef.current = items;
                            }}
                        />
                        <Flex items="center" justify="end" gap="1" mt="2">
                            <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => changeIsOpenedState(false)}>
                                {t("common.Cancel")}
                            </Button>
                            <SubmitButton type="button" size="sm" onClick={save} isValidating={isValidating}>
                                {saveText ?? t("common.Save")}
                            </SubmitButton>
                        </Flex>
                    </Popover.Content>
                </Popover.Root>
            </Flex>
        );
    }
);
MultiSelectAssigneesPopover.displayName = "MultiSelectAssigneesPopover";

export interface IBaseMultiSelectAssigneesFormProps {
    multiSelectProps: Pick<
        TMultiSelectProps & { isNewCommandItemMultiple?: false },
        | "placeholder"
        | "className"
        | "badgeClassName"
        | "inputClassName"
        | "validateCreatedNewValue"
        | "createNewCommandItemLabel"
        | "multipleSplitter"
    >;
    isValidating: bool;
    canAssignNonMembers?: bool;
    allItems: TMultiSelectAssigneeItem[];
    groups?: UserGroup.TModel[];
    selectableFilter?: (item: TMultiSelectAssigneeItem) => bool;
    newItemFilter?: (item: TMultiSelectAssigneeItem) => bool;
    initialSelectedItems: TMultiSelectAssigneeItem[];
    createNewUserLabel?: (item: TMultiSelectAssigneeItem) => string;
    onValueChange: (items: TMultiSelectAssigneeItem[]) => void;
    setSelectedItemsRef?: React.RefObject<React.Dispatch<React.SetStateAction<TMultiSelectAssigneeItem[]>>>;
}

interface IMultiSelectAssigneesFormWithNonMembersProps extends IBaseMultiSelectAssigneesFormProps {
    canAssignNonMembers: true;
}

interface IMultiSelectAssigneesFormWithOnlyMembersProps extends IBaseMultiSelectAssigneesFormProps {
    canAssignNonMembers?: false;
}

export type TMultiSelectAssigneesFormProps = IMultiSelectAssigneesFormWithNonMembersProps | IMultiSelectAssigneesFormWithOnlyMembersProps;

export const MultiSelectAssigneesForm = memo(
    ({
        multiSelectProps,
        isValidating,
        allItems,
        groups,
        selectableFilter,
        canAssignNonMembers,
        newItemFilter,
        initialSelectedItems,
        createNewUserLabel,
        onValueChange,
        setSelectedItemsRef,
    }: TMultiSelectAssigneesFormProps) => {
        const [t] = useTranslation();
        const [isOpened, setIsOpened] = useState(false);
        const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
        if (setSelectedItemsRef) {
            setSelectedItemsRef.current = setSelectedItems;
        }
        const findItemByValue = (value: string): User.TModel | undefined => {
            if (!value) {
                return undefined;
            }

            const item = allItems.find((item) => getMultiSelectItemValue(item) === value);
            if (!item) {
                if (canAssignNonMembers) {
                    return User.Model.createTempEmailUser(value);
                }
                return item;
            }

            return getMultiSelectItemAsUser(item);
        };
        const addGroupMembers = useCallback(
            (group: UserGroup.TModel) => {
                setSelectedItems((prev) => {
                    const newItems = [...prev];
                    for (let i = 0; i < group.users.length; ++i) {
                        const user = group.users[i];
                        if (newItems.includes(user) || !(newItemFilter?.(user) ?? true)) {
                            continue;
                        }

                        if (canAssignNonMembers || (!user.isPresentableUnknownUser() && allItems.includes(user))) {
                            newItems.push(user);
                        }
                    }
                    setTimeout(() => {
                        onValueChange?.(newItems);
                    }, 0);
                    return newItems;
                });
            },
            [groups]
        );
        const onSelected = useCallback(
            (values: string[]) => {
                const filteredValues = values.filter((value) => !!findItemByValue(value));
                let isChanged = filteredValues.length !== selectedItems.length;
                if (!isChanged) {
                    for (let i = 0; i < filteredValues.length; ++i) {
                        const item = findItemByValue(filteredValues[i]);
                        if (!item || !selectedItems.includes(item)) {
                            isChanged = true;
                            break;
                        }
                    }
                }

                if (!isChanged) {
                    return;
                }

                setSelectedItems(() => {
                    const newItems: User.TModel[] = [];
                    for (let i = 0; i < filteredValues.length; ++i) {
                        const item = findItemByValue(filteredValues[i]);
                        if (item) {
                            newItems.push(item);
                        }
                    }
                    setTimeout(() => {
                        onValueChange?.(newItems);
                    }, 0);
                    return newItems;
                });
            },
            [selectedItems]
        );

        useEffect(() => {
            setSelectedItems(initialSelectedItems);
        }, [initialSelectedItems]);

        return (
            <>
                <MultiSelect
                    selections={allItems
                        .filter((item) => selectableFilter?.(item) ?? true)
                        .map((item) => {
                            const isNewItem = newItemFilter?.(item) ?? false;
                            const itemValue = getMultiSelectItemValue(item);
                            const itemLabel = getMultiSelectItemLabel(item);

                            return {
                                value: itemValue,
                                label: isNewItem && createNewUserLabel ? createNewUserLabel(item) : itemLabel,
                            };
                        })}
                    selectedValue={selectedItems.map(getMultiSelectItemValue).filter((value) => !!value)}
                    createBadgeWrapper={(badge, value) => {
                        const selectedItem = findItemByValue(value);
                        if (!selectedItem) {
                            return null;
                        }

                        return (
                            <UserAvatar.Root user={selectedItem} customTrigger={badge} key={createShortUUID()}>
                                <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                            </UserAvatar.Root>
                        );
                    }}
                    disabled={isValidating}
                    onValueChange={onSelected}
                    canCreateNew={canAssignNonMembers as false}
                    validateCreatedNewValue={((value: string) => EMAIL_REGEX.test(value)) as never}
                    createNewCommandItemLabel={((values: string[]) => t("common.Assign '{emails}'", { emails: values })) as never}
                    {...(multiSelectProps as Record<string, unknown>)}
                />
                {groups && (
                    <DropdownMenu.Root open={isOpened} onOpenChange={setIsOpened}>
                        <DropdownMenu.Trigger asChild>
                            <Button variant="secondary" size="sm" disabled={!groups.length || isValidating}>
                                {t("common.Add members from group")}
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Group>
                                {groups.map((group) => (
                                    <DropdownMenu.Item key={`group-${group.name}-${createShortUUID()}`} onClick={() => addGroupMembers(group)}>
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
MultiSelectAssigneesForm.displayName = "MultiSelectAssigneesForm";

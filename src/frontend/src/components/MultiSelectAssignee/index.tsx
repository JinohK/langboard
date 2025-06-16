/* eslint-disable @typescript-eslint/no-explicit-any */
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button, Flex, IconComponent, Popover as BasePopover, ButtonProps, SubmitButton, DropdownMenu } from "@/components/base";
import {
    ISelectEditorProps,
    SelectEditor,
    SelectEditorCombobox,
    SelectEditorContent,
    SelectEditorInput,
    TSelectItem,
} from "@/components/Editor/select-editor";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { BotModel, User, UserGroup } from "@/core/models";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IUserAvatarListProps, UserAvatarList } from "@/components/UserAvatarList";
import { TIconProps } from "@/components/base/IconComponent";
import { createShortUUID } from "@/core/utils/StringUtils";

export type TAssignee = User.TModel | BotModel.TModel;

export type TAssigneeSelecItem = TSelectItem & {
    assignee: TAssignee;
};

export type TSaveHandler =
    | ((assignees: TAssignee[]) => void)
    | ((assignees: TAssignee[]) => Promise<void>)
    | ((assignees: (string | TAssignee)[]) => void)
    | ((assignees: (string | TAssignee)[]) => Promise<void>);

export const getMultiSelectItemAsUser = (item: TAssignee): User.TModel => {
    if (item.MODEL_NAME === BotModel.Model.MODEL_NAME) {
        return (item as BotModel.TModel).as_user;
    } else {
        return item as User.TModel;
    }
};

const createAssigneeSelectItemCreator =
    (createSearchText: (item: TAssignee) => string, createLabel: (item: TAssignee) => string) =>
    (item: TAssignee): TAssigneeSelecItem => ({
        value: createSearchText(item),
        label: createLabel(item),
        assignee: item,
    });

export interface IPopoverProps
    extends Omit<IFormProps, "useEditorProps">,
        Pick<
            Required<IFormProps>["useEditorProps"],
            "save" | "canAddNew" | "validateNewItem" | "createNewItemLabel" | "withUserGroups" | "groups" | "filterGroupUser"
        > {
    popoverButtonProps?: ButtonProps;
    popoverContentProps?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
    userAvatarListProps?: Omit<IUserAvatarListProps, "users">;
    showableAssignees?: TAssignee[];
    multiSelectProps?: Omit<React.ComponentPropsWithoutRef<typeof SelectEditor>, "value" | "onValueChange" | "items">;
    addIcon?: React.ComponentPropsWithoutRef<TIconProps>["icon"];
    addIconSize?: React.ComponentPropsWithoutRef<TIconProps>["size"];
    canEdit?: bool;
    saveText?: string;
}

const Popover = memo((props: IPopoverProps) => {
    const { userAvatarListProps, originalAssignees, showableAssignees = originalAssignees, tagContentProps = {}, canEdit } = props;

    return (
        <Flex items="center" gap="1">
            {showableAssignees.length > 0 && (
                <UserAvatarList users={showableAssignees.map(getMultiSelectItemAsUser)} {...(tagContentProps as any)} {...userAvatarListProps} />
            )}
            {canEdit && <PopoverInner {...props} />}
        </Flex>
    );
});

const PopoverInner = memo((props: IPopoverProps) => {
    const [t] = useTranslation();
    const {
        popoverButtonProps = {},
        popoverContentProps,
        addIcon = "plus",
        addIconSize,
        canAddNew = false,
        save,
        saveText,
        withUserGroups,
        groups,
        filterGroupUser,
        validateNewItem,
        createNewItemLabel,
    } = props;
    const { variant: popoverButtonVariant = "outline" } = popoverButtonProps;
    const [isValidating, setIsValidating] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const [selectedValues, setSelectedValues] = useState<(string | TAssignee)[]>([]);

    const handleSave = useCallback(async () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        await save(selectedValues as any);

        setIsValidating(false);
        setIsOpened(false);
    }, [save, selectedValues]);

    return (
        <BasePopover.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <BasePopover.Trigger asChild>
                <Button variant={popoverButtonVariant} {...popoverButtonProps}>
                    <IconComponent icon={addIcon} size={addIconSize} />
                </Button>
            </BasePopover.Trigger>
            <BasePopover.Content {...popoverContentProps}>
                <Form
                    {...props}
                    useEditorProps={{
                        useButton: false,
                        isValidating,
                        readOnly: false,
                        setReadOnly: () => {},
                        canAddNew,
                        onValueChange: setSelectedValues,
                        save: handleSave,
                        withUserGroups: withUserGroups as true,
                        groups: groups as UserGroup.TModel[],
                        filterGroupUser,
                        validateNewItem,
                        createNewItemLabel,
                    }}
                />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={handleSave} isValidating={isValidating}>
                        {saveText ?? t("common.Save")}
                    </SubmitButton>
                </Flex>
            </BasePopover.Content>
        </BasePopover.Root>
    );
});

export interface IFormProps {
    TagContent?: React.ComponentType<TAssigneeSelecItem & { assignee: TAssignee; label?: string; readOnly: bool } & Record<string, unknown>>;
    tagContentProps?: Record<string, unknown>;
    allSelectables: TAssignee[];
    originalAssignees: TAssignee[];
    createSearchText: (item: TAssignee) => string;
    createLabel: (item: TAssignee) => string;
    placeholder?: string;
    useEditorProps?: {
        canAddNew?: bool;
        useButton?: bool;
        isValidating: bool;
        readOnly: bool;
        setReadOnly: (readOnly: bool) => void;
        onValueChange?: ((items: TAssignee[]) => void) | ((items: (string | TAssigneeSelecItem)[]) => void);
        save: TSaveHandler;
        withUserGroups?: bool;
        groups?: UserGroup.TModel[];
        filterGroupUser?: (user: User.TModel) => bool;
    } & Pick<ISelectEditorProps, "validateNewItem" | "createNewItemLabel">;
}

const Form = memo(
    ({
        TagContent = FormTagContent,
        tagContentProps = {},
        allSelectables,
        originalAssignees,
        createSearchText,
        createLabel,
        placeholder,
        useEditorProps,
    }: IFormProps) => {
        const [t] = useTranslation();
        const createAssigneeSelectItem = createAssigneeSelectItemCreator(createSearchText, createLabel);
        const selectables = useMemo<TAssigneeSelecItem[]>(() => allSelectables.map(createAssigneeSelectItem), [allSelectables]);
        const [selectedValues, setSelectedValues] = useState<TAssigneeSelecItem[]>(originalAssignees.map(createAssigneeSelectItem));

        useEffect(() => {
            const newSelectedAssignees = originalAssignees.map(createAssigneeSelectItem);

            setSelectedValues(newSelectedAssignees);
            useEditorProps?.onValueChange?.(newSelectedAssignees.map((item) => item.assignee) as any);
        }, [originalAssignees, useEditorProps?.onValueChange]);

        const handleValueChange = useCallback(
            (items: TSelectItem[]) => {
                if (useEditorProps) {
                    setSelectedValues(items as TAssigneeSelecItem[]);
                    useEditorProps.onValueChange?.(items.map((item) => (item.isNew ? item.value : (item as TAssigneeSelecItem).assignee)) as any);
                }
            },
            [setSelectedValues, useEditorProps?.onValueChange]
        );

        const handleSave = useCallback(async () => {
            if (!useEditorProps) {
                return;
            }

            if (useEditorProps.readOnly) {
                useEditorProps.setReadOnly(false);
                return;
            }

            await useEditorProps.save(selectedValues.map((item) => (item.isNew ? item.value : item.assignee)) as any);
            useEditorProps.setReadOnly(true);
        }, [selectedValues, useEditorProps?.save]);

        return (
            <Flex direction="col" py="4" gap="1">
                <Flex items="center" gap="1">
                    <SelectEditor
                        value={selectedValues}
                        onValueChange={handleValueChange}
                        items={selectables}
                        createTagContent={
                            ((props: TAssigneeSelecItem & { readOnly: bool; label?: string }) => <TagContent {...props} {...tagContentProps} />) as (
                                props: TSelectItem & { readOnly: bool }
                            ) => JSX.Element
                        }
                        canAddNew={useEditorProps?.canAddNew}
                        validateNewItem={useEditorProps?.validateNewItem}
                        createNewItemLabel={useEditorProps?.createNewItemLabel}
                    >
                        <SelectEditorContent>
                            <SelectEditorInput
                                readOnly={useEditorProps?.readOnly}
                                disabled={useEditorProps?.isValidating}
                                placeholder={placeholder}
                            />
                            <SelectEditorCombobox />
                        </SelectEditorContent>
                    </SelectEditor>
                    {useEditorProps && useEditorProps.useButton && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-10"
                            title={useEditorProps.readOnly ? t("common.Edit") : t("common.Save")}
                            titleSide="bottom"
                            onClick={handleSave}
                            disabled={useEditorProps.isValidating}
                            type="button"
                        >
                            <IconComponent icon={useEditorProps.readOnly ? "plus" : "check"} size="4" />
                        </Button>
                    )}
                </Flex>
                {useEditorProps && useEditorProps.withUserGroups && !useEditorProps.readOnly && useEditorProps.groups && (
                    <UserGroupSelectDropdownMenu
                        isValidating={useEditorProps.isValidating}
                        groups={useEditorProps.groups}
                        filterGroupUser={useEditorProps.filterGroupUser}
                        selectedValues={selectedValues}
                        onValueChange={handleValueChange}
                        createAssigneeSelectItem={createAssigneeSelectItem}
                    />
                )}
            </Flex>
        );
    }
);

function FormTagContent({ assignee, ...props }: TAssigneeSelecItem & { readOnly: bool; label?: string } & Record<string, unknown>) {
    const Comp = assignee?.MODEL_NAME === BotModel.Model.MODEL_NAME ? MultiSelectBotTagContent : MultiSelectUserTagContent;

    if (props.isNew) {
        return props.value;
    }

    return <Comp assignee={assignee as User.TModel & BotModel.TModel} {...props} />;
}

function MultiSelectBotTagContent({
    assignee,
    label,
    readOnly,
    ...props
}: TAssigneeSelecItem & { assignee: BotModel.TModel; label?: string; readOnly: bool } & Record<string, unknown>) {
    const name = assignee.useField("name");
    const botUname = assignee.useField("bot_uname");
    const botAsUser = assignee.useForeignField<User.TModel>("as_user")[0];

    return (
        <UserAvatar.Root user={botAsUser} customTrigger={<>{label ?? `${name} (${botUname})`}</>}>
            <UserAvatarDefaultList user={botAsUser} {...props} />
        </UserAvatar.Root>
    );
}

function MultiSelectUserTagContent({
    assignee,
    label,
    readOnly,
    ...props
}: TAssigneeSelecItem & { assignee: User.TModel; label?: string; readOnly: bool } & Record<string, unknown>) {
    const firstname = assignee.useField("firstname");
    const lastname = assignee.useField("lastname");

    return (
        <UserAvatar.Root user={assignee} customTrigger={label ?? `${firstname} ${lastname}`}>
            <UserAvatarDefaultList user={assignee} {...props} />
        </UserAvatar.Root>
    );
}

type TUserGroupSelectDropdownMenuProps = Pick<Required<IFormProps>["useEditorProps"], "isValidating" | "filterGroupUser"> & {
    groups: UserGroup.TModel[];
    selectedValues: TAssigneeSelecItem[];
    onValueChange: (items: TSelectItem[]) => void;
    createAssigneeSelectItem: (item: TAssignee) => TAssigneeSelecItem;
};

function UserGroupSelectDropdownMenu({
    isValidating,
    groups,
    selectedValues,
    filterGroupUser,
    onValueChange,
    createAssigneeSelectItem,
}: TUserGroupSelectDropdownMenuProps) {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const selectableGroups = useMemo(() => {
        const newUsers: Record<string, { uid: string; name: string; users: User.TModel[] }> = {};
        for (let i = 0; i < groups.length; ++i) {
            const group = groups[i];
            const users = [...group.users].filter(
                (user) => (filterGroupUser?.(user) ?? true) && !selectedValues.some((item) => item.assignee?.uid === user.uid)
            );

            if (users.length > 0) {
                newUsers[group.uid] = {
                    uid: group.uid,
                    name: group.name,
                    users,
                };
            }
        }
        return newUsers;
    }, [selectedValues, groups]);

    const addGroupMembers = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const groupUID = e.currentTarget.dataset.uid;
        if (!groupUID || !selectableGroups[groupUID]) {
            return;
        }

        const group = selectableGroups[groupUID];
        const newItems = group.users.map(createAssigneeSelectItem);

        onValueChange([...selectedValues, ...newItems]);
    };

    return (
        <DropdownMenu.Root open={isOpened} onOpenChange={setIsOpened}>
            <DropdownMenu.Trigger asChild>
                <Button variant="secondary" size="sm" disabled={!Object.keys(selectableGroups).length || isValidating}>
                    {t("common.Add members from group")}
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Group>
                    {Object.values(selectableGroups).map((group) => (
                        <DropdownMenu.Item key={`group-${group.name}-${createShortUUID()}`} data-uid={group.uid} onClick={addGroupMembers}>
                            {group.name}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default { Form, Popover };

import { MultiSelectAssigneesPopover, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import { Flex, Label, Skeleton, Switch, Toast } from "@/components/base";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import useChangeWikiPublic from "@/controllers/api/wiki/useChangeWikiPublic";
import useUpdateWikiAssignedUsers from "@/controllers/api/wiki/useUpdateWikiAssignedUsers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectWiki, User, UserGroup } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiPrivateOptionProps {
    wiki: ProjectWiki.TModel;
    changeTab: (uid: string) => void;
}

export function SkeletonWikiPrivateOption() {
    return (
        <Flex items="center" gap="4" pl="1" h="8" justify={{ initial: "between", sm: "start" }}>
            <Flex inline items="center" gap="2">
                <Skeleton h="6" w="11" rounded="full" />
                <Skeleton h="6" w="20" />
            </Flex>
            <SkeletonUserAvatarList count={4} size="sm" spacing="none" />
        </Flex>
    );
}

const WikiPrivateOption = memo(({ wiki, changeTab }: IWikiPrivateOptionProps) => {
    const [t] = useTranslation();
    const { projectUID, projectMembers, currentUser } = useBoardWiki();
    const isPublic = wiki.useField("is_public");
    const isForbidden = wiki.useField("forbidden");
    const isChangedTabRef = useRef(false);
    const assignedMembers = wiki.useForeignField<User.TModel>("assigned_members");
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: changeWikiPublicMutateAsync } = useChangeWikiPublic();
    const { mutateAsync: updateWikiAssignedUsersMutateAsync } = useUpdateWikiAssignedUsers();

    useEffect(() => {
        if (isForbidden && !isChangedTabRef.current) {
            Toast.Add.error(t("wiki.errors.Can't access this wiki."));
            changeTab("");
        } else {
            isChangedTabRef.current = false;
        }
    }, [isForbidden]);

    const savePrivateState = (privateState: bool) => {
        if (isValidating || privateState === !isPublic) {
            return;
        }

        setIsValidating(true);

        const promise = changeWikiPublicMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            is_public: !privateState,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
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
                return t("wiki.successes.Public state changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    const saveAssignedUsers = (items: TMultiSelectAssigneeItem[]) => {
        if (isValidating || isPublic) {
            return;
        }

        setIsValidating(true);

        const promise = updateWikiAssignedUsersMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            assigned_users: User.filterValidUserUIDs(items as User.TModel[]),
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
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
                return t("wiki.successes.Assigned users updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Flex items="center" gap="4" h="8">
            <Label display="inline-flex" cursor="pointer" items="center" gap="2">
                <Switch checked={!isPublic} onCheckedChange={savePrivateState} />
                <span>{t(`wiki.${isPublic ? "Public" : "Private"}`)}</span>
            </Label>
            {!isPublic && (
                <MultiSelectAssigneesPopover
                    popoverButtonProps={{
                        size: "icon",
                        className: "size-8",
                        title: t("project.Assign members"),
                    }}
                    popoverContentProps={{
                        className: "w-full max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.10))]",
                        align: "start",
                    }}
                    userAvatarListProps={{
                        maxVisible: 4,
                        size: "sm",
                        spacing: "3",
                        listAlign: "start",
                    }}
                    multiSelectProps={{
                        placeholder: t("card.Select members..."),
                        className: cn(
                            "max-w-[calc(100vw_-_theme(spacing.20))]",
                            "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                            "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]"
                        ),
                        inputClassName: "ml-1 placeholder:text-gray-500 placeholder:font-medium",
                    }}
                    addIconSize="6"
                    onSave={saveAssignedUsers}
                    isValidating={isValidating}
                    allItems={projectMembers}
                    groups={groups}
                    assignedFilter={(item) => assignedMembers.includes(item as User.TModel)}
                    initialSelectedItems={assignedMembers}
                />
            )}
        </Flex>
    );
});

export default WikiPrivateOption;

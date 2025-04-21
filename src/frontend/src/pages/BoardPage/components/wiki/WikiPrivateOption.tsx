import { MultiSelectAssigneesPopover, TMultiSelectAssigneeItem } from "@/components/MultiSelectPopoverForm";
import { Flex, Label, Skeleton, Switch, Toast } from "@/components/base";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import useChangeWikiPublic from "@/controllers/api/wiki/useChangeWikiPublic";
import useUpdateWikiAssignees from "@/controllers/api/wiki/useUpdateWikiAssignees";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, ProjectWiki, User, UserGroup } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";

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
    const { projectUID, projectBots, projectMembers, currentUser, navigate } = useBoardWiki();
    const isPublic = wiki.useField("is_public");
    const forbidden = wiki.useField("forbidden");
    const isChangedTabRef = useRef(false);
    const assignedBots = wiki.useForeignField<BotModel.TModel>("assigned_bots");
    const assignedMembers = wiki.useForeignField<User.TModel>("assigned_members");
    const groups = currentUser.useForeignField<UserGroup.TModel>("user_groups");
    const allItems = useMemo(() => [...projectBots, ...projectMembers], [projectBots, projectMembers]);
    const [isValidating, setIsValidating] = useState(false);
    const isValidatingRef = useRef(isValidating);
    const { mutateAsync: changeWikiPublicMutateAsync } = useChangeWikiPublic();
    const { mutateAsync: updateWikiAssigneesMutateAsync } = useUpdateWikiAssignees();

    useEffect(() => {
        if (forbidden && !isChangedTabRef.current) {
            Toast.Add.error(t("wiki.errors.Can't access this wiki."));
            changeTab("");
            isChangedTabRef.current = true;
        } else {
            isChangedTabRef.current = false;
        }
    }, [forbidden]);

    const savePrivateState = (privateState: bool) => {
        if (isValidatingRef.current || privateState === !isPublic) {
            return;
        }

        setIsValidating(true);
        isValidatingRef.current = true;

        const promise = changeWikiPublicMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            is_public: !privateState,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("wiki.errors.Can't access this wiki.");
                        setTimeout(() => {
                            navigate(ROUTES.BOARD.WIKI(projectUID));
                        }, 0);
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
                return t("wiki.successes.Public state changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                isValidatingRef.current = false;
            },
        });
    };

    const saveAssignees = (items: TMultiSelectAssigneeItem[], endCallback: () => void) => {
        if (isValidatingRef.current || isPublic) {
            return;
        }

        setIsValidating(true);
        isValidatingRef.current = true;

        const promise = updateWikiAssigneesMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            assignees: items.map((item) => item.uid),
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("wiki.errors.Can't access this wiki.");
                        setTimeout(() => {
                            navigate(ROUTES.BOARD.WIKI(projectUID));
                        }, 0);
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
                return t("wiki.successes.Assigned bots and members updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                isValidatingRef.current = false;
                endCallback();
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
                    onSave={saveAssignees}
                    isValidating={isValidating}
                    allItems={allItems}
                    groups={groups}
                    assignedFilter={(item) => {
                        if (item instanceof User.Model) {
                            return assignedMembers.includes(item);
                        } else {
                            return assignedBots.includes(item);
                        }
                    }}
                    initialSelectedItems={allItems.filter(
                        (item) => assignedBots.includes(item as BotModel.TModel) || assignedMembers.includes(item as User.TModel)
                    )}
                    canEdit
                    projectUID={projectUID}
                />
            )}
        </Flex>
    );
});

export default WikiPrivateOption;

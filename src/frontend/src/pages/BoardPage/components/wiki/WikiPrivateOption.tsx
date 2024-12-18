import { AssignMemberPopover } from "@/components/AssignMemberPopover";
import { Flex, Label, Skeleton, Switch, Toast } from "@/components/base";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import useChangeWikiPublic from "@/controllers/api/wiki/useChangeWikiPublic";
import useUpdateWikiAssignedUsers from "@/controllers/api/wiki/useUpdateWikiAssignedUsers";
import useBoardWikiAssignedUsersUpdatedHandlers from "@/controllers/socket/wiki/useBoardWikiAssignedUsersUpdatedHandlers";
import useBoardWikiPublicChangedHandlers from "@/controllers/socket/wiki/useBoardWikiPublicChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectWiki, User } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiPrivateOptionProps {
    wiki: ProjectWiki.Interface;
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
    const { projectUID, projectMembers, setWikis, socket, currentUser } = useBoardWiki();
    const [isPrivate, setIsPrivate] = useState(!wiki.is_public);
    const [isValidating, setIsValidating] = useState(false);
    const [assignedUsers, setAssignedUsers] = useState<User.Interface[]>(wiki.assigned_members ?? []);
    const { mutateAsync: changeWikiPublicMutateAsync } = useChangeWikiPublic();
    const { mutateAsync: updateWikiAssignedUsersMutateAsync } = useUpdateWikiAssignedUsers();
    const updateWiki = (wiki: ProjectWiki.Interface) => {
        setWikis((prev) =>
            prev.map((prevWiki) => {
                if (prevWiki.uid === wiki.uid) {
                    return wiki;
                }

                return prevWiki;
            })
        );
    };
    const { on: onBoardWikiPublicChanged } = useBoardWikiPublicChangedHandlers({
        socket,
        projectUID,
        wikiUID: wiki.uid,
        callback: (data) => {
            updateWiki(data.wiki);
            setIsPrivate(!data.wiki.is_public);
            setAssignedUsers(data.wiki.assigned_members ?? []);
        },
    });
    const { on: onBoardPrivateWikiPublicChanged } = useBoardWikiPublicChangedHandlers({
        socket,
        projectUID,
        wikiUID: wiki.uid,
        username: currentUser.username,
        callback: (data) => {
            updateWiki(data.wiki);
            if (data.wiki.forbidden) {
                Toast.Add.error(t("wiki.Can't access this wiki."));
                changeTab("");
            } else {
                setIsPrivate(!data.wiki.is_public);
                setAssignedUsers(data.wiki.assigned_members ?? []);
            }
        },
    });
    const { on: onBoardPrivateWikiAssignedUsersUpdated } = useBoardWikiAssignedUsersUpdatedHandlers({
        socket,
        projectUID,
        wikiUID: wiki.uid,
        username: currentUser.username,
        callback: (data) => {
            updateWiki(data.wiki);
            if (data.wiki.forbidden) {
                Toast.Add.error(t("wiki.Can't access this wiki."));
                changeTab("");
            } else {
                setIsPrivate(!data.wiki.is_public);
                setAssignedUsers(data.wiki.assigned_members ?? []);
            }
        },
    });

    useEffect(() => {
        const { off: offBoardWikiPublicChanged } = onBoardWikiPublicChanged();
        const { off: offBoardPrivateWikiPublicChanged } = onBoardPrivateWikiPublicChanged();
        const { off: offBoardPrivateWikiAssignedUsersUpdated } = onBoardPrivateWikiAssignedUsersUpdated();

        return () => {
            offBoardWikiPublicChanged();
            offBoardPrivateWikiPublicChanged();
            offBoardPrivateWikiAssignedUsersUpdated();
        };
    }, []);

    const savePrivateState = (privateState: bool) => {
        if (isValidating || privateState === isPrivate) {
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
                return t("wiki.Public state changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    const saveAssignedUsers = (users: User.Interface[]) => {
        if (isValidating || !isPrivate) {
            return;
        }

        setIsValidating(true);

        const promise = updateWikiAssignedUsersMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            assigned_users: users.map((user) => user.id),
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
                setAssignedUsers(users);
                return t("wiki.Assigned users updated successfully.");
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
                <Switch checked={isPrivate} onCheckedChange={savePrivateState} />
                <span>{t(`wiki.${isPrivate ? "Private" : "Public"}`)}</span>
            </Label>
            {isPrivate && (
                <AssignMemberPopover
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
                    onSave={saveAssignedUsers}
                    isValidating={isValidating}
                    allUsers={projectMembers}
                    assignedUsers={assignedUsers}
                    iconSize="6"
                    canControlAssignedUsers
                />
            )}
        </Flex>
    );
});

export default WikiPrivateOption;

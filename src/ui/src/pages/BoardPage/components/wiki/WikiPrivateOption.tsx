import { Flex, Label, Skeleton, Switch, Toast } from "@/components/base";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import useChangeWikiPublic from "@/controllers/api/wiki/useChangeWikiPublic";
import useUpdateWikiAssignees from "@/controllers/api/wiki/useUpdateWikiAssignees";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BotModel, ProjectWiki, User } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { ROUTES } from "@/core/routing/constants";
import MultiSelectAssignee, { TSaveHandler } from "@/components/MultiSelectAssignee";
import { TUserLikeModel } from "@/core/models/ModelRegistry";

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
    const assignedBots = wiki.useForeignField("assigned_bots");
    const assignedMembers = wiki.useForeignField("assigned_members");
    const groups = currentUser.useForeignField("user_groups");
    const allItems = useMemo(() => [...projectBots, ...projectMembers].filter((item) => item.uid !== currentUser.uid), [projectBots, projectMembers]);
    const showableAssignees = useMemo(() => [...assignedBots, ...assignedMembers], [assignedBots, assignedMembers]);
    const originalAssignees = useMemo(
        () => [...assignedBots, ...assignedMembers].filter((item) => item.uid !== currentUser.uid),
        [assignedBots, assignedMembers]
    );
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: changeWikiPublicMutateAsync } = useChangeWikiPublic({ interceptToast: true });
    const { mutateAsync: updateWikiAssigneesMutateAsync } = useUpdateWikiAssignees({ interceptToast: true });

    useEffect(() => {
        if (forbidden && !isChangedTabRef.current) {
            Toast.Add.error(t("errors.requests.PE2006"));
            changeTab("");
            isChangedTabRef.current = true;
        } else {
            isChangedTabRef.current = false;
        }
    }, [forbidden]);

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

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.BOARD.WIKI(projectUID)),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Public state changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const saveAssignees = (items: TUserLikeModel[]) => {
        if (isValidating || isPublic) {
            return;
        }

        setIsValidating(true);

        const promise = updateWikiAssigneesMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            assignees: items.map((item) => item.uid),
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.BOARD.WIKI(projectUID)),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Assigned bots and members updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
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
                <MultiSelectAssignee.Popover
                    popoverButtonProps={{
                        size: "icon",
                        className: "size-8",
                        title: t("project.Assign members"),
                    }}
                    popoverContentProps={{
                        className: cn(
                            "max-w-[calc(100vw_-_theme(spacing.20))]",
                            "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                            "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]"
                        ),
                        align: "start",
                    }}
                    userAvatarListProps={{
                        maxVisible: 4,
                        size: "sm",
                        spacing: "3",
                        listAlign: "start",
                    }}
                    placeholder={t("wiki.Select members and bots...")}
                    allSelectables={allItems}
                    originalAssignees={originalAssignees}
                    showableAssignees={showableAssignees}
                    tagContentProps={{
                        projectUID,
                    }}
                    addIconSize="6"
                    save={saveAssignees as TSaveHandler}
                    createSearchText={(item) => {
                        if (item.MODEL_NAME === BotModel.Model.MODEL_NAME) {
                            item = item as BotModel.TModel;
                            return `${item.uid} ${item.name} ${item.bot_uname}`;
                        } else {
                            item = item as User.TModel;
                            return `${item.uid} ${item.firstname} ${item.lastname} ${item.email}`;
                        }
                    }}
                    createLabel={(item) => {
                        if (item.MODEL_NAME === BotModel.Model.MODEL_NAME) {
                            item = item as BotModel.TModel;
                            return `${item.name} (${item.bot_uname})`;
                        } else {
                            item = item as User.TModel;
                            return `${item.firstname} ${item.lastname}`.trim();
                        }
                    }}
                    groups={groups}
                    canEdit
                />
            )}
        </Flex>
    );
});

export default WikiPrivateOption;

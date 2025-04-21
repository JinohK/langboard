/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, Box, Flex, IconComponent, Skeleton, Tooltip } from "@/components/base";
import VersionHistoryPlate from "@/components/Editor/version-history-plate";
import UserAvatar from "@/components/UserAvatar";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { ActivityModel, AuthUser, ProjectCard, User } from "@/core/models";
import { IBotInActivityHistory, IChangesInActivityHistory, IUserInActivityHistory } from "@/core/models/activities/base.type";
import { IProjectActivityHistory } from "@/core/models/activities/project.activity.type";
import { IProjectCardActivityHistory } from "@/core/models/activities/project.card.activity.type";
import { IProjectCardAttachmentActivityHistory } from "@/core/models/activities/project.card.attachment.activity.type";
import { IProjectCardCheckitemActivityHistory } from "@/core/models/activities/project.card.checkitem.activity.type";
import { IProjectCardChecklistActivityHistory } from "@/core/models/activities/project.card.checklist.activity.type";
import { IProjectColumnActivityHistory } from "@/core/models/activities/project.column.activity.type";
import { IProjectLabelActivityHistory } from "@/core/models/activities/project.label.activity.type";
import { IProjectWikiActivityHistory } from "@/core/models/activities/project.wiki.activity.type";
import { ROUTES } from "@/core/routing/constants";
import { ColorGenerator, getTextColorFromHex } from "@/core/utils/ColorUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { createNameInitials, createShortUUID } from "@/core/utils/StringUtils";
import React, { memo, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";

export interface IActivityTimelineProps {
    activity: ActivityModel.TModel | ActivityModel.TActivity;
    references?: ActivityModel.TModel["references"];
}

interface IBaseActivityComponentProps {
    references: ActivityModel.TModel["references"];
}

const useCreateActivityTimeline = (currentUser: AuthUser.TModel, isUserView?: bool) => {
    const [t] = useTranslation();
    const navigateRef = useRef(usePageNavigate());

    const SkeletonActivity = memo(() => (
        <Flex direction="col" gap="1" p="2">
            <Flex items="start" gap="1">
                {!isUserView && <Skeleton size="8" rounded="full" />}
                <Skeleton h="6" mt="1" className="w-3/5 md:w-2/5" />
            </Flex>
            <Flex items="center" justify="end">
                <Skeleton as="span" h="5" w="32" />
            </Flex>
        </Flex>
    ));

    const ActivityTimeline = memo(({ activity, references }: IActivityTimelineProps) => {
        const activityType = activity.activity_type;
        const activityHistory = activity.activity_history;
        const activityCreatedAt = useUpdateDateDistance(activity.created_at);
        const filterableType = activity.filterable_type;
        const subFilterableType = activity.sub_filterable_type;
        const refer = activity.refer;

        if (refer) {
            return <ActivityTimeline activity={refer} references={activity.references} />;
        }

        const activityReferences = { ...(references ?? {}) };
        let i18nKey;
        switch (filterableType) {
            case "user":
                i18nKey = `activity.user.${activityType}`;
                break;
            case "project":
                {
                    const viewType = isUserView ? "user_view" : "default";
                    const subType = subFilterableType ? `.${subFilterableType}` : "";
                    i18nKey = `activity.project${subType}.${activityType}.${viewType}`;
                }
                break;
        }

        if (subFilterableType && references && !references[subFilterableType]) {
            activityReferences[subFilterableType] = { uid: activity.sub_filterable_uid! };
        }

        return (
            <Flex direction="col" gap="1" rounded="md" border p="2">
                <Flex items="start" gap="1">
                    {!isUserView && (
                        <Box>
                            <UserOrBotComponent userOrBot={activityHistory.recorder} onlyAvatar />
                        </Box>
                    )}
                    <Box pt="1" className="break-words leading-6">
                        <Trans i18nKey={i18nKey} values={activityHistory} components={createComponents(activityHistory, activityReferences)} />
                    </Box>
                </Flex>
                <DiffView history={activityHistory} />
                <Box textSize="sm" className="text-right text-muted-foreground">
                    {activityCreatedAt}
                </Box>
            </Flex>
        );
    });
    ActivityTimeline.displayName = "ActivityTimeline";

    const createComponents = (history: any, references: IActivityTimelineProps["references"]): Record<string, React.ReactElement> => {
        const components: Record<string, React.ReactElement> = {};
        Object.entries(history).forEach(([key, value]) => {
            switch (key) {
                case "recorder":
                    components.Recorder = <UserOrBotComponent userOrBot={value} onlyName />;
                    break;
                case "project":
                    components.Project = <ProjectComponent project={value} references={{ ...history, ...references }} />;
                    break;
                case "column":
                    components.Column = <ProjectColumnComponent column={value} references={{ ...history, ...references }} />;
                    break;
                case "from_column":
                    components.FromColumn = <ProjectColumnComponent column={value} references={{ ...history, ...references }} />;
                    break;
                case "label":
                    components.Label = <ProjectLabelComponent label={value} references={{ ...history, ...references }} />;
                    break;
                case "wiki":
                    components.Wiki = <ProjectWikiComponent wiki={value} references={{ ...history, ...references }} />;
                    break;
                case "card":
                    components.Card = <ProjectCardComponent card={value} references={{ ...history, ...references }} />;
                    break;
                case "attachment":
                    components.Attachment = <ProjectCardAttachmentComponent attachment={value} references={{ ...history, ...references }} />;
                    break;
                case "checklist":
                    components.Checklist = <ProjectCardChecklistComponent checklist={value} references={{ ...history, ...references }} />;
                    break;
                case "checkitem":
                    components.Checkitem = <ProjectCardCheckitemComponent checkitem={value} references={{ ...history, ...references }} />;
                    break;
                case "cardified_card":
                    components.CardifiedCard = (
                        <ProjectCardComponent
                            card={value}
                            references={{
                                ...history,
                                ...references,
                                card: {
                                    uid: value.uid,
                                    title: history.checkitem.title,
                                } as ProjectCard.Interface,
                            }}
                        />
                    );
                    break;
                case "bot":
                    components.Bot = <UserOrBotComponent userOrBot={value} />;
                    break;
            }
        });

        return components;
    };

    const UserOrBotComponent = ({
        userOrBot,
        onlyName = false,
        onlyAvatar = false,
    }: {
        userOrBot: IBotInActivityHistory | IUserInActivityHistory;
        onlyName?: bool;
        onlyAvatar?: bool;
    }) => {
        let initials;
        let fallback;
        let names;
        switch (userOrBot.type) {
            case "bot":
                fallback = <IconComponent icon="bot" className="h-[80%] w-[80%]" />;
                initials = createNameInitials(userOrBot.name, "");
                names = userOrBot.name;
                break;
            case "unknown":
                fallback = <IconComponent icon="user" className="h-[80%] w-[80%]" />;
                initials = "";
                names = t("common.Unknown User");
                break;
            case "user":
                fallback = initials = createNameInitials(userOrBot.firstname, userOrBot.lastname);
                names = `${userOrBot.firstname} ${userOrBot.lastname}`;
                break;
        }

        const [bgColor, textColor] = new ColorGenerator(initials).generateAvatarColor();

        const styles: Record<string, string> = {
            "--avatar-bg": bgColor,
            "--avatar-text-color": textColor,
        };

        const avatarFallbackClassNames = "bg-[--avatar-bg] font-semibold text-[--avatar-text-color]";

        const avatar = (
            <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION}>
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                        <Avatar.Root size="sm" className={cn(UserAvatar.TriggerVariants({ hoverable: true }), "cursor-default")}>
                            <Avatar.Image src={userOrBot.avatar} />
                            <Avatar.Fallback className={avatarFallbackClassNames} style={styles}>
                                {fallback}
                            </Avatar.Fallback>
                        </Avatar.Root>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{names}</Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        );

        const nameComp = (
            <Box as="span" weight="semibold">
                {names}
            </Box>
        );

        if (onlyAvatar) {
            return avatar;
        }

        if (onlyName) {
            return nameComp;
        }

        return (
            <Flex inline items="center" gap="1" position="relative">
                <Box position="absolute">{avatar}</Box>
                <Box ml="9">{nameComp}</Box>
            </Flex>
        );
    };

    const DiffView = ({ history }: { history: any }) => {
        if (!history.changes) {
            return null;
        }

        const changes: IChangesInActivityHistory["changes"] = history.changes;
        const elements: React.ReactNode[] = [];

        Object.entries(changes.before).forEach(([key, value]) => {
            const before = value;
            const after = changes.after[key];

            if (before === after) {
                return;
            }

            if (before?.type === "editor" || after?.type === "editor") {
                const mentionables = [...(before?.mentionables ?? []), ...(after?.mentionables ?? [])].map(
                    (mentionable: IBotInActivityHistory | IUserInActivityHistory) => {
                        const isBot = mentionable.type === "bot";
                        return User.Model.createFakeUser({
                            type: mentionable.type,
                            uid: "0",
                            firstname: isBot ? mentionable.name : mentionable.firstname,
                            lastname: isBot ? "" : mentionable.lastname,
                            username: "",
                            email: "",
                            avatar: mentionable.avatar,
                        });
                    }
                );

                elements.push(
                    <VersionHistoryPlate
                        mentionables={mentionables}
                        currentUser={currentUser}
                        oldValue={before}
                        newValue={after}
                        key={createShortUUID()}
                    />
                );
                return;
            }

            const i18nKey = `activity.changes.${key}`;
            let beforeElement;
            let afterElement;
            switch (key) {
                case "title":
                case "name":
                case "project_type":
                    beforeElement = <>{before}</>;
                    afterElement = <>{after}</>;
                    break;
                case "description":
                    beforeElement = <>{before ?? t("activity.changes.No description")}</>;
                    afterElement = <>{after ?? t("activity.changes.No description")}</>;
                    break;
                case "ai_description":
                    beforeElement = <>{before ?? t("activity.changes.No AI summary")}</>;
                    afterElement = <>{after ?? t("activity.changes.No AI summary")}</>;
                    break;
                case "content":
                    beforeElement = <>{before ?? t("activity.changes.No content")}</>;
                    afterElement = <>{after ?? t("activity.changes.No content")}</>;
                    break;
                case "deadline_at":
                    beforeElement = <>{before ?? t("activity.changes.No deadline")}</>;
                    afterElement = <>{after ?? t("activity.changes.No deadline")}</>;
                    break;
                case "color":
                    beforeElement = (
                        <ActivityBadge style={{ backgroundColor: before ?? "#000", color: getTextColorFromHex(before ?? "#000") }}>
                            {changes.before?.name ?? history.label?.name ?? "color"}
                        </ActivityBadge>
                    );
                    afterElement = (
                        <ActivityBadge style={{ backgroundColor: after ?? "#000", color: getTextColorFromHex(after ?? "#000") }}>
                            {changes.after?.name ?? history.label?.name ?? "color"}
                        </ActivityBadge>
                    );
                    break;
                default:
                    return;
            }

            elements.push(
                <Flex items="center" gap="3" key={createShortUUID()}>
                    <Box>{t(i18nKey)}</Box>
                    <Flex items="center" gap="1.5">
                        {beforeElement}
                        <IconComponent icon="arrow-right" />
                        {afterElement}
                    </Flex>
                </Flex>
            );
        });

        if (!elements.length) {
            return null;
        }

        return (
            <Box px="3" py="2" ml={isUserView ? "0" : "9"} my="1" border rounded="md" className="bg-secondary/25">
                {elements}
            </Box>
        );
    };

    const ActivityBadge = ({ moveUrl, style, children }: { moveUrl?: string; style?: Record<string, any>; children: React.ReactNode }) => {
        return (
            <Box
                as="span"
                border
                rounded="md"
                px="2"
                py="0.5"
                textSize="sm"
                cursor={moveUrl ? "pointer" : undefined}
                className={cn("bg-muted text-muted-foreground", !!moveUrl && "transition-all hover:bg-primary hover:text-primary-foreground")}
                onClick={moveUrl ? () => navigateRef.current(moveUrl) : undefined}
                style={style}
            >
                {children}
            </Box>
        );
    };

    const ProjectComponent = ({ project, references }: IBaseActivityComponentProps & { project: IProjectActivityHistory["project"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.MAIN(references!.project!.uid)}>{project.title}</ActivityBadge>;
    };

    const ProjectColumnComponent = ({ column, references }: IBaseActivityComponentProps & { column: IProjectColumnActivityHistory["column"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.MAIN(references!.project!.uid)}>{column.name}</ActivityBadge>;
    };

    const ProjectLabelComponent = ({ label, references }: IBaseActivityComponentProps & { label: IProjectLabelActivityHistory["label"] }) => {
        return (
            <ActivityBadge
                moveUrl={ROUTES.BOARD.MAIN(references!.project!.uid)}
                style={{
                    backgroundColor: label.color,
                    color: getTextColorFromHex(label.color),
                }}
            >
                {label.name}
            </ActivityBadge>
        );
    };

    const ProjectWikiComponent = ({ wiki, references }: IBaseActivityComponentProps & { wiki: IProjectWikiActivityHistory["wiki"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.WIKI_PAGE(references!.project!.uid, references!.project_wiki!.uid)}>{wiki.title}</ActivityBadge>;
    };

    const ProjectCardComponent = ({ card, references }: IBaseActivityComponentProps & { card: IProjectCardActivityHistory["card"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.CARD(references!.project!.uid, references!.card!.uid)}>{card.title}</ActivityBadge>;
    };

    const ProjectCardAttachmentComponent = ({
        attachment,
        references,
    }: IBaseActivityComponentProps & { attachment: IProjectCardAttachmentActivityHistory["attachment"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.CARD(references!.project!.uid, references!.card!.uid)}>{attachment.name}</ActivityBadge>;
    };

    const ProjectCardChecklistComponent = ({
        checklist,
        references,
    }: IBaseActivityComponentProps & { checklist: IProjectCardChecklistActivityHistory["checklist"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.CARD(references!.project!.uid, references!.card!.uid)}>{checklist.title}</ActivityBadge>;
    };

    const ProjectCardCheckitemComponent = ({
        checkitem,
        references,
    }: IBaseActivityComponentProps & { checkitem: IProjectCardCheckitemActivityHistory["checkitem"] }) => {
        return <ActivityBadge moveUrl={ROUTES.BOARD.CARD(references!.project!.uid, references!.card!.uid)}>{checkitem.title}</ActivityBadge>;
    };

    return { SkeletonActivity, ActivityTimeline };
};

export default useCreateActivityTimeline;

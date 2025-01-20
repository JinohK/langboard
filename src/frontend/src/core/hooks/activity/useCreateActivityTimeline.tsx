/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, Box, Flex, IconComponent, Skeleton, Tooltip } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { ActivityModel, Project, ProjectCard, ProjectWiki } from "@/core/models";
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
import { createNameInitials } from "@/core/utils/StringUtils";
import React, { memo, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";

export interface IActivityTimelineProps {
    activity: ActivityModel.TModel | ActivityModel.TActivity;
    references?: {
        project?: Project.TModel | Project.Interface;
        card?: ProjectCard.TModel | ProjectCard.Interface;
        project_wiki?: ProjectWiki.TModel | ProjectWiki.Interface;
    };
    isCurrentUser?: bool;
}

interface IBaseActivityComponentProps {
    references: IActivityTimelineProps["references"];
}

const useCreateActivityTimeline = () => {
    const [t] = useTranslation();
    const navigateRef = useRef(usePageNavigate());

    const SkeletonActivity = memo(() => <Skeleton as="span" h="14" w="56" display="block" />);

    const ActivityTimeline = memo(({ activity, references, isCurrentUser = true }: IActivityTimelineProps) => {
        const activityType = activity.activity_type;
        const activityHistory = activity.activity_history;
        const activityCreatedAt = useUpdateDateDistance(activity.created_at);
        const filterableType = activity.filterable_type;
        const subFilterableType = activity.sub_filterable_type;
        const refer = activity.refer;

        if (refer) {
            return <ActivityTimeline activity={refer} references={activity.references} isCurrentUser={isCurrentUser} />;
        }

        let i18nKey;
        switch (filterableType) {
            case "user":
                i18nKey = `activity.user.${activityType}`;
                break;
            case "project":
                {
                    const viewType = isCurrentUser ? "user_view" : "default";
                    const subType = subFilterableType ? `.${subFilterableType}` : "";
                    i18nKey = `activity.project${subType}.${activityType}.${viewType}`;
                }
                break;
        }

        return (
            <Flex direction="col" gap="1" rounded="md" border p="2">
                <Flex items="start" gap="1">
                    {!isCurrentUser && (
                        <Box>
                            <UserOrBotComponent userOrBot={activityHistory.recorder} onlyAvatar />
                        </Box>
                    )}
                    <Box pt="1" className="break-words leading-6">
                        <Trans i18nKey={i18nKey} values={activityHistory} components={createComponents(activityHistory, references)} />
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
                    components.Project = <ProjectComponent project={value} references={{ ...references, ...history }} />;
                    break;
                case "column":
                    components.Column = <ProjectColumnComponent column={value} references={{ ...references, ...history }} />;
                    break;
                case "from_column":
                    components.FromColumn = <ProjectColumnComponent column={value} references={{ ...references, ...history }} />;
                    break;
                case "label":
                    components.Label = <ProjectLabelComponent label={value} references={{ ...references, ...history }} />;
                    break;
                case "wiki":
                    components.Wiki = <ProjectWikiComponent wiki={value} references={{ ...references, ...history }} />;
                    break;
                case "card":
                    components.Card = <ProjectCardComponent card={value} references={{ ...references, ...history }} />;
                    break;
                case "attachment":
                    components.Attachment = <ProjectCardAttachmentComponent attachment={value} references={{ ...references, ...history }} />;
                    break;
                case "checklist":
                    components.Checklist = <ProjectCardChecklistComponent checklist={value} references={{ ...references, ...history }} />;
                    break;
                case "checkitem":
                    components.Checkitem = <ProjectCardCheckitemComponent checkitem={value} references={{ ...references, ...history }} />;
                    break;
                case "cardified_card":
                    components.CardifiedCard = (
                        <ProjectCardComponent
                            card={value}
                            references={{
                                ...references,
                                ...history,
                                card: {
                                    uid: value.uid,
                                    title: history.checkitem.title,
                                } as ProjectCard.Interface,
                            }}
                        />
                    );
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
            <Flex inline items="center" gap="1">
                {avatar}
                {nameComp}
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

            // TODO: Add more diff types
        });

        return <>{elements}</>;
    };

    const ActivityBadge = ({ moveUrl, style, children }: { moveUrl: string; style?: Record<string, any>; children: React.ReactNode }) => {
        return (
            <Box
                as="span"
                border
                rounded="md"
                px="2"
                py="0.5"
                textSize="sm"
                cursor="pointer"
                className="bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigateRef.current(moveUrl)}
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

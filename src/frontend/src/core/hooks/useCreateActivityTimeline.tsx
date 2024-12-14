import { IconComponent, Skeleton, Timeline } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { Activity, User } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import { memo, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";

export interface IActivityTimelineProps {
    activity: Activity.Interface;
    user: User.Interface;
    isCurrentUser?: bool;
}

const useCreateActivityTimeline = (type: string, withDiffView: bool = false) => {
    const [t] = useTranslation();
    const navigate = useRef(usePageNavigate());
    const transComponentsRef = useRef<{ readonly [tagName: string]: React.ReactElement }>({
        primary: <span className="font-semibold text-primary" />,
    });

    const getLink = (activityType: Activity.Interface["activity_type"], shared: Activity.Interface["activity"]["shared"]) => {
        switch (activityType) {
            case "project.created":
            case "project.updated":
            case "project.assigned_user":
            case "project.unassigned_user":
            case "project.assigned_group":
            case "project.unassigned_group":
            case "project.column_changed_order":
                return ROUTES.BOARD.MAIN(shared.project_uid as string);
            case "card.changed_column":
                return ROUTES.BOARD.CARD(shared.project_uid as string, shared.card_uid as string);
            default:
                return null;
        }
    };

    const transformValues = (activity: Activity.Interface["activity"]) => {
        const values: Record<string, unknown> = {};
        Object.entries(activity).forEach(([key, map]) => {
            if (!map) {
                return;
            }

            const newMap: Record<string, unknown> = {};
            Object.keys(map).forEach((subKey) => {
                switch (subKey) {
                    case "project_type":
                        newMap[subKey] = t(map[subKey] === "Other" ? "common.Other" : `project.types.${map[subKey]}`);
                        return;
                    default:
                        newMap[subKey] = map[subKey];
                        return;
                }
            });
            values[key] = newMap;
        });

        return values;
    };

    const SkeletonActivity = memo(() => (
        <Timeline.Item status="done" className="gap-x-2">
            <Timeline.Heading>
                <Skeleton as="span" className="block h-6 w-44" />
            </Timeline.Heading>
            <Timeline.Dot
                status="custom"
                customIcon={<Skeleton as="span" className="inline-block size-8 rounded-full" />}
                className="size-8 border-none"
            />
            <Timeline.Line done className="animate-pulse rounded-md bg-primary/10" />
            <Timeline.Content>
                <Skeleton as="span" className="block h-14 w-56" />
            </Timeline.Content>
        </Timeline.Item>
    ));

    const ActivityTimeline = memo(({ activity, user, isCurrentUser = true }: IActivityTimelineProps) => {
        const link = getLink(activity.activity_type, activity.activity.shared);
        let avatar;
        if (isCurrentUser) {
            avatar = <UserAvatar.Root user={user} avatarSize="sm" />;
        } else {
            avatar = (
                <UserAvatar.Root user={user} avatarSize="sm">
                    <UserAvatar.List>
                        <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                    </UserAvatar.List>
                </UserAvatar.Root>
            );
        }

        let headingClassName;
        let onClick;
        if (link) {
            headingClassName = "flex items-center gap-2 cursor-pointer transition-all hover:text-primary/75";
            onClick = () => {
                navigate.current(link);
            };
        }

        return (
            <Timeline.Item status="done" className="gap-x-2" key={`activity-${createShortUUID()}`}>
                <Timeline.Heading className={headingClassName} onClick={onClick}>
                    {t(`activity.${type}.${activity.activity_type}.title`)}
                    {link && <IconComponent icon="square-arrow-out-up-right" size="4" />}
                </Timeline.Heading>
                <Timeline.Dot status="custom" customIcon={avatar} className="size-8" />
                <Timeline.Line done />
                <Timeline.Content className="w-">
                    <Trans
                        i18nKey={`activity.${type}.${activity.activity_type}.content`}
                        values={transformValues(activity.activity)}
                        components={transComponentsRef.current}
                    />
                </Timeline.Content>
            </Timeline.Item>
        );
    });

    return { SkeletonActivity, ActivityTimeline };
};

export default useCreateActivityTimeline;

import { IconComponent, Timeline } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { Activity, User } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const useCreateActivityTimeline = (type: string) => {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const transComponentsRef = useRef<{ readonly [tagName: string]: React.ReactElement }>({
        primary: <span className="font-semibold text-primary" />,
    });

    const getLink = (activityType: Activity.Interface["activity_type"], shared: Activity.Interface["activity"]["shared"]) => {
        switch (activityType) {
            case "project.created":
                return ROUTES.BOARD.MAIN(shared.uid as string);
            case "project.updated":
                return ROUTES.BOARD.MAIN(shared.uid as string);
            case "task.changed_order":
                return ROUTES.BOARD.TASK(shared.project_uid as string, shared.task_uid as string);
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

    const create = (activity: Activity.Interface, user: User.Interface, isCurrentUser: bool = true) => {
        const link = getLink(activity.activity_type, activity.activity.shared);
        let avatar;
        if (isCurrentUser) {
            avatar = <UserAvatar.Root user={user} avatarSize="sm" />;
        } else {
            avatar = (
                <UserAvatar.Root user={user} avatarSize="sm">
                    <UserAvatar.List>
                        <UserAvatar.ListLabel>{user.email}</UserAvatar.ListLabel>
                    </UserAvatar.List>
                </UserAvatar.Root>
            );
        }

        let headingClassName;
        let onClick;
        if (link) {
            headingClassName = "flex items-center gap-2 cursor-pointer transition-all hover:text-primary/75";
            onClick = () => {
                navigate(link);
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
    };

    return { create };
};

export default useCreateActivityTimeline;

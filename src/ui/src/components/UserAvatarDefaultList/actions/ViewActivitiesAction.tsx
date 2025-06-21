import { Popover } from "@/components/base";
import { AuthUser, Project, User } from "@/core/models";
import ActivityList from "@/components/ActivityList";
import UserAvatar, { getAvatarHoverCardAttrs } from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";

export interface IUserAvatarDefaultViewActivitiesActionProps {
    user: User.TModel;
    project: Project.TModel;
    currentUser: AuthUser.TModel;
}

function UserAvatarDefaultViewActivitiesAction({ user, project, currentUser }: IUserAvatarDefaultViewActivitiesActionProps): JSX.Element | null {
    const [t] = useTranslation();
    const triggerRef = useRef<HTMLDivElement>(null);
    const [isOpened, setIsOpened] = useState(false);
    const [maxHeight, setMaxHeight] = useState("0px");
    const [side, setSide] = useState<React.ComponentProps<typeof Popover.Content>["side"]>("bottom");
    const style = {
        "--max-height": maxHeight,
    };
    const checkSize = useCallback(() => {
        if (!triggerRef.current || !isOpened) {
            return;
        }

        const rect = triggerRef.current.getBoundingClientRect();
        const MAX_HEIGHT = 500;
        const PADDING_SIZE = 16;
        const topSideHeight = rect.top - PADDING_SIZE;
        const bottomSideHeight = document.body.scrollHeight - rect.bottom - PADDING_SIZE;

        let futureMaxHeight: number;
        let futureSide: React.ComponentProps<typeof Popover.Content>["side"];

        if (rect.bottom + MAX_HEIGHT <= document.body.scrollHeight) {
            futureMaxHeight = MAX_HEIGHT;
            futureSide = "bottom";
        } else if (rect.top - MAX_HEIGHT >= 0) {
            futureMaxHeight = MAX_HEIGHT;
            futureSide = "top";
        } else {
            futureMaxHeight = Math.max(topSideHeight, bottomSideHeight);
            futureSide = topSideHeight > bottomSideHeight ? "top" : "bottom";
        }

        setMaxHeight(() => `${futureMaxHeight}px`);
        setSide(() => futureSide);
    }, [isOpened]);

    useEffect(() => {
        checkSize();

        let timeout: NodeJS.Timeout;
        const handler = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                checkSize();
                clearTimeout(timeout);
            }, 100);
        };

        window.addEventListener("resize", handler);
        window.addEventListener("scroll", handler);

        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("scroll", handler);
        };
    }, [isOpened]);

    return (
        <Popover.Root modal={false} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <UserAvatar.ListItem ref={triggerRef}>{t("common.avatarActions.View activities")}</UserAvatar.ListItem>
            </Popover.Trigger>
            <Popover.Content
                className="z-[999999] w-auto sm:max-w-screen-xs md:max-w-screen-sm lg:max-w-screen-md"
                side={side}
                {...getAvatarHoverCardAttrs(user)}
            >
                <ActivityList
                    form={{ type: "project_assignee", assignee_uid: user.uid, project_uid: project.uid }}
                    currentUser={currentUser}
                    infiniteScrollerClassName="max-h-[calc(var(--max-height)_-_theme(spacing.8))] px-4 pb-2.5"
                    style={style as React.CSSProperties}
                    isUserView
                />
            </Popover.Content>
        </Popover.Root>
    );
}

export default UserAvatarDefaultViewActivitiesAction;

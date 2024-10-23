import { Button, Card, IconComponent, Skeleton, Toast, Tooltip } from "@/components/base";
import { IDashboardProject } from "@/controllers/dashboard/useGetProjects";
import useToggleStarProject from "@/controllers/dashboard/useToggleStarProject";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUID } from "@/core/utils/StringUtils";
import { isAxiosError } from "axios";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

interface IBaseProjectCardListProps {
    isSkeleton?: boolean;
    project?: IDashboardProject;
    refetchAllStarred?: () => Promise<unknown>;
    refetchProjects?: () => Promise<unknown>;
}

interface ISkeletonProjectCardListProps extends IBaseProjectCardListProps {
    isSkeleton: true;
}

interface IProjectCardProps extends IBaseProjectCardListProps {
    isSkeleton?: false;
    project: IDashboardProject;
    refetchAllStarred: () => Promise<unknown>;
    refetchProjects: () => Promise<unknown>;
}

export type TProjectCardProps = IProjectCardProps | ISkeletonProjectCardListProps;

const ProjectCard = memo(({ isSkeleton, project, refetchAllStarred, refetchProjects }: TProjectCardProps): JSX.Element => {
    const [t] = useTranslation();
    const { mutate } = useToggleStarProject();
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleStar = () => {
        if (!project) {
            return;
        }

        setIsUpdating(true);

        mutate(
            {
                uid: project.uid,
            },
            {
                onSuccess: async () => {
                    if (isSkeleton) {
                        return;
                    }

                    await Promise.all([refetchAllStarred(), refetchProjects()]);
                },
                onError: (error) => {
                    if (!isAxiosError(error)) {
                        console.error(error);
                        Toast.Add.error(t("errors.Unknown error"));
                        return;
                    }

                    if (error.response?.status === EHttpStatus.HTTP_404_NOT_FOUND) {
                        Toast.Add.error(t("dashboard.errors.Project not found"));
                        return;
                    }

                    Toast.Add.error(t("errors.Internal server error"));
                },
                onSettled: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    let cardClassNames = "cursor-pointer";
    let groupNames;
    let title;
    let starBtn;
    let tasks;
    if (isSkeleton) {
        cardClassNames = "border-transparent shadow-transparent";
        groupNames = <Skeleton className="inline-block h-3.5 w-1/2" />;
        title = <Skeleton className="inline-block h-4 w-3/4" />;
        starBtn = <Skeleton className="absolute right-2.5 top-1 mt-0 inline-block h-9 w-9 rounded-md" />;
        tasks = [];
        for (let i = 0; i < 6; ++i) {
            tasks.push({
                type: null,
                subtasks: <Skeleton className="inline-block h-3.5 w-3/4" />,
                color: <Skeleton className="inline-block h-0.5 w-full rounded-full" />,
            });
        }
    } else {
        groupNames = project!.group_names.length ? project!.group_names.join(", ") : <>&nbsp;</>;
        title = project!.title;
        starBtn = (
            <Tooltip.Provider delayDuration={400} key={createShortUID()}>
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                        <Button
                            variant={project?.starred ? "default" : "outline"}
                            className="absolute right-2.5 top-1 mt-0"
                            size="icon"
                            onClick={toggleStar}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <IconComponent icon="loader-circle" size="5" strokeWidth={3} className="animate-spin" />
                            ) : (
                                <IconComponent icon="star" />
                            )}
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom">
                        {t(`dashboard.${project?.starred ? "Unstar this project" : "Star this project"}`)}
                    </Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        );

        // TODO: Task, Fix here after implementing task
        tasks = [
            {
                type: "Request",
                subtasks: Math.floor(Math.random() * 100),
                color: "bg-blue-500",
            },
            {
                type: "Preparation",
                subtasks: Math.floor(Math.random() * 100),
                color: "bg-yellow-500",
            },
            {
                type: "Development",
                subtasks: Math.floor(Math.random() * 100),
                color: "bg-green-500",
            },
            {
                type: "Testing",
                subtasks: Math.floor(Math.random() * 100),
                color: "bg-pink-500",
            },
            {
                type: "Deployment",
                subtasks: Math.floor(Math.random() * 100),
                color: "bg-purple-500",
            },
            {
                type: "Completed",
                subtasks: Math.floor(Math.random() * 100),
                color: "bg-gray-500",
            },
        ];
    }

    return (
        <Card.Root className={cardClassNames}>
            <Card.Header className="relative block pt-5">
                <Card.Title className="text-sm text-gray-500">{groupNames}</Card.Title>
                <Card.Title>{title}</Card.Title>
                {starBtn}
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-center gap-1.5">
                {tasks.map((task) => {
                    if (isSkeleton) {
                        return (
                            <div className="flex min-w-5 flex-col items-center gap-0.5" key={createShortUID()}>
                                {task.subtasks}
                                {task.color}
                            </div>
                        );
                    } else {
                        return (
                            <Tooltip.Provider delayDuration={400} key={createShortUID()}>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <div className="flex min-w-5 flex-col gap-0.5 text-center">
                                            <span className="text-sm font-semibold">{task.subtasks}</span>
                                            <div className={cn("inline-block h-0.5 w-full rounded-full", task.color as string)} />
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content side="bottom">{task.type}</Tooltip.Content>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        );
                    }
                })}
            </Card.Footer>
        </Card.Root>
    );
});

export default ProjectCard;

import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Card, Flex, IconComponent, Skeleton, Toast, Tooltip } from "@/components/base";
import { IDashboardProject } from "@/controllers/dashboard/useGetProjects";
import useToggleStarProject from "@/controllers/dashboard/useToggleStarProject";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import { ColorGenerator } from "@/core/utils/ColorUtils";

export interface IProjectCardListProps {
    project: IDashboardProject;
    refetchAllStarred: () => Promise<unknown>;
    refetchProjects: () => Promise<unknown>;
}

export const SkeletonProjectCard = memo(() => {
    const cards = [];
    for (let i = 0; i < 6; ++i) {
        cards.push({
            type: null,
            subcards: <Skeleton className="inline-block h-3.5 w-3/4" />,
            color: <Skeleton className="inline-block h-0.5 w-full rounded-full" />,
        });
    }

    return (
        <Card.Root className="border-transparent shadow-transparent">
            <Card.Header className="relative block pt-5">
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] text-sm leading-tight text-gray-500">
                    <Skeleton className="inline-block h-3.5 w-1/2" />
                </Card.Title>
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">
                    <Skeleton className="inline-block h-4 w-3/4" />
                </Card.Title>
                <Skeleton className="absolute right-2.5 top-1 mt-0 inline-block size-9 rounded-md" />
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-center gap-1.5">
                {cards.map((card) => (
                    <Flex direction="col" items="center" gap="0.5" className="min-w-5" key={createShortUUID()}>
                        {card.subcards}
                        {card.color}
                    </Flex>
                ))}
            </Card.Footer>
        </Card.Root>
    );
});

const ProjectCard = memo(({ project, refetchAllStarred, refetchProjects }: IProjectCardListProps): JSX.Element => {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const { mutate } = useToggleStarProject();
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleStar = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!project) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        setIsUpdating(true);

        mutate(
            {
                uid: project.uid,
            },
            {
                onSuccess: async () => {
                    await Promise.all([refetchAllStarred(), refetchProjects()]);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("dashboard.errors.Project not found"));
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    const toBoard = () => {
        if (!project) {
            return;
        }

        navigate(ROUTES.BOARD.MAIN(project.uid));
    };

    return (
        <Card.Root className="cursor-pointer" onClick={toBoard}>
            <Card.Header className="relative block pt-5">
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] text-sm leading-tight text-gray-500">
                    {project.group_names.length ? project.group_names.join(", ") : <>&nbsp;</>}
                </Card.Title>
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">{project.title}</Card.Title>
                <Tooltip.Provider delayDuration={400} key={createShortUUID()}>
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
                                    <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" />
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
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-center gap-1.5">
                {project.columns.map((column) => (
                    <Tooltip.Provider delayDuration={400} key={createShortUUID()}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <Flex direction="col" gap="0.5" className="min-w-5 text-center">
                                    <span className="text-sm font-semibold">{column.count}</span>
                                    <div
                                        className="inline-block h-0.5 w-full rounded-full"
                                        style={{ background: new ColorGenerator(column.name).generateRandomColor() }}
                                    />
                                </Flex>
                            </Tooltip.Trigger>
                            <Tooltip.Content side="bottom">{column.name}</Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                ))}
            </Card.Footer>
        </Card.Root>
    );
});

export default ProjectCard;

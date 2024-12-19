import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, Flex, IconComponent, Skeleton, Toast, Tooltip } from "@/components/base";
import useToggleStarProject from "@/controllers/api/dashboard/useToggleStarProject";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { Project } from "@/core/models";
import { useDashboard } from "@/core/providers/DashboardProvider";
import useDashboardCardCreatedHandlers from "@/controllers/socket/dashboard/useDashboardCardCreatedHandlers";
import useDashboardCardOrderChangedHandlers from "@/controllers/socket/dashboard/useDashboardCardOrderChangedHandlers";
import useProjectColumnCreatedHandlers from "@/controllers/socket/project/useProjectColumnCreatedHandlers";
import useProjectColumnNameChangedHandlers from "@/controllers/socket/project/useProjectColumnNameChangedHandlers";
import useProjectColumnOrderChangedHandlers from "@/controllers/socket/project/useProjectColumnOrderChangedHandlers";
import { arrayMove } from "@dnd-kit/sortable";
import useProjectTitleChangedHandlers from "@/controllers/socket/project/useProjectTitleChangedHandlers";
import useProjectTypeChangedHandlers from "@/controllers/socket/project/useProjectTypeChangedHandlers";

export const SkeletonProjectCard = memo(() => {
    const cards = [];
    for (let i = 0; i < 6; ++i) {
        cards.push({
            type: null,
            subcards: <Skeleton display="inline-block" h="3.5" className="w-3/4" />,
            color: <Skeleton display="inline-block" h="0.5" w="full" rounded="full" />,
        });
    }

    return (
        <Card.Root className="border-transparent shadow-transparent">
            <Card.Header className="relative block pt-5">
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] text-sm leading-tight text-gray-500">
                    <Skeleton display="inline-block" h="3.5" className="w-1/2" />
                </Card.Title>
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">
                    <Skeleton display="inline-block" h="4" className="w-3/4" />
                </Card.Title>
                <Skeleton position="absolute" right="2.5" top="1" display="inline-block" size="9" />
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-center gap-1.5">
                {cards.map((card) => (
                    <Flex direction="col" items="center" gap="0.5" minW="5" key={createShortUUID()}>
                        {card.subcards}
                        {card.color}
                    </Flex>
                ))}
            </Card.Footer>
        </Card.Root>
    );
});

export interface IProjectCardProps {
    project: Project.IDashboard;
    refetchAllStarred: () => Promise<unknown>;
    refetchAllProjects: () => Promise<unknown>;
}

const ProjectCard = memo(({ project, refetchAllStarred, refetchAllProjects }: IProjectCardProps): JSX.Element => {
    const [t] = useTranslation();
    const { navigate, socket } = useDashboard();
    const { mutate } = useToggleStarProject();
    const [isUpdating, setIsUpdating] = useState(false);
    const [title, setTitle] = useState(project.title);
    const [projectType, setProjectType] = useState(project.project_type);
    const [columns, setColumns] = useState(project.columns);
    const { on: onProjectTitleChanged } = useProjectTitleChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            project.title = data.title;
            setTitle(data.title);
        },
    });
    const { on: onProjectTypeChanged } = useProjectTypeChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            project.project_type = data.project_type;
            setProjectType(data.project_type);
        },
    });
    const { on: onProjectColumnCreated } = useProjectColumnCreatedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            setColumns((prev) => prev.filter((column) => column.uid !== data.column.uid).concat(data.column));
        },
    });
    const { on: onProjectColumnNameChanged } = useProjectColumnNameChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            setColumns((prev) => {
                const targetColumn = prev.find((column) => column.uid === data.uid);
                if (targetColumn) {
                    targetColumn.name = data.name;
                }
                return [...prev];
            });
        },
    });
    const { on: onProjectColumnOrderChanged } = useProjectColumnOrderChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            setColumns((prev) => {
                const targetColumn = prev.find((column) => column.uid === data.uid);
                if (targetColumn) {
                    return arrayMove(prev, targetColumn.order, data.order).map((column, index) => {
                        column.order = index;
                        return column;
                    });
                }

                return [...prev];
            });
        },
    });
    const { on: onDashboardCardCreated } = useDashboardCardCreatedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            setColumns((prev) => {
                const targetColumn = prev.find((column) => column.uid === data.column_uid);
                if (targetColumn) {
                    targetColumn.count += 1;
                }
                return [...prev];
            });
        },
    });
    const { on: onDashboardCardOrderChanged } = useDashboardCardOrderChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            setColumns((prev) => {
                const fromColumn = prev.find((column) => column.uid === data.from_column_uid);
                const toColumn = prev.find((column) => column.uid === data.to_column_uid);
                if (fromColumn && toColumn) {
                    fromColumn.count -= 1;
                    toColumn.count += 1;
                }
                return [...prev];
            });
        },
    });

    useEffect(() => {
        const { off: offProjectTitleChanged } = onProjectTitleChanged();
        const { off: offProjectTypeChanged } = onProjectTypeChanged();
        const { off: offProjectColumnCreated } = onProjectColumnCreated();
        const { off: offProjectColumnNameChanged } = onProjectColumnNameChanged();
        const { off: offProjectColumnOrderChanged } = onProjectColumnOrderChanged();
        const { off: offDashboardCardCreated } = onDashboardCardCreated();
        const { off: offDashboardCardOrderChanged } = onDashboardCardOrderChanged();

        return () => {
            offProjectTitleChanged();
            offProjectTypeChanged();
            offProjectColumnCreated();
            offProjectColumnNameChanged();
            offProjectColumnOrderChanged();
            offDashboardCardCreated();
            offDashboardCardOrderChanged();
        };
    }, []);

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
                    await Promise.all([refetchAllStarred(), refetchAllProjects()]);
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
                    {t(projectType === "Other" ? "common.Other" : `project.types.${projectType}`)}
                </Card.Title>
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">{title}</Card.Title>
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
                {columns.map((column) => (
                    <Tooltip.Provider delayDuration={400} key={createShortUUID()}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <Flex direction="col" gap="0.5" minW="5" className="text-center">
                                    <span className="text-sm font-semibold">{column.count}</span>
                                    <Box
                                        display="inline-block"
                                        h="0.5"
                                        w="full"
                                        rounded="full"
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

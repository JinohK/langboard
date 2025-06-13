import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Flex, Skeleton } from "@/components/base";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import { Project, ProjectColumn } from "@/core/models";
import { useDashboard } from "@/core/providers/DashboardProvider";
import ProjectItemColumn from "@/pages/DashboardPage/components/ProjectItemColumn";
import ProjectItemStarButton from "@/pages/DashboardPage/components/ProjectItemStarButton";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { cn } from "@/core/utils/ComponentUtils";

export const SkeletonProjectItem = memo(() => {
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

export interface IProjectItemProps extends React.ComponentPropsWithoutRef<typeof Card.Root> {
    project: Project.TModel;
    updateStarredProjects: React.DispatchWithoutAction;
}

const ProjectItem = memo(({ project, updateStarredProjects, ...props }: IProjectItemProps): JSX.Element => {
    const [t] = useTranslation();
    const { navigate } = useDashboard();
    const [isUpdating, setIsUpdating] = useState(false);
    const title = project.useField("title");
    const projectType = project.useField("project_type");
    const flatColumns = project.useForeignField<ProjectColumn.TModel>("columns");
    const [columns, setColumns] = useState(flatColumns);

    const toBoard = () => {
        if (!project) {
            return;
        }

        navigate(ROUTES.BOARD.MAIN(project.uid));
    };

    return (
        <Card.Root {...props} className={cn(props.className, "cursor-pointer")} onClick={toBoard}>
            <ModelRegistry.Project.Provider model={project}>
                <Card.Header className="relative block pt-5">
                    <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] text-sm leading-tight text-gray-500">
                        {t(projectType === "Other" ? "common.Other" : `project.types.${projectType}`)}
                    </Card.Title>
                    <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">{title}</Card.Title>
                    <ProjectItemStarButton isUpdating={isUpdating} setIsUpdating={setIsUpdating} updateStarredProjects={updateStarredProjects} />
                </Card.Header>
                <Card.Content></Card.Content>
                <Card.Footer className="flex items-center gap-1.5">
                    {columns.map((column) => (
                        <ProjectItemColumn key={createShortUUID()} column={column} setColumns={setColumns} />
                    ))}
                </Card.Footer>
            </ModelRegistry.Project.Provider>
        </Card.Root>
    );
});

export default ProjectItem;

import { Accordion } from "@/components/base";
import { IProject } from "@/controllers/dashboard/useGetProjects";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUID, makeReactKey } from "@/core/utils/StringUtils";
import ProjectCard from "@/pages/DashboardPage/components/ProjectCard";
import { useTranslation } from "react-i18next";

interface IBaseProjectCardListProps {
    isMobile?: boolean;
    isSkeleton?: boolean;
    count?: number;
    title: string;
    projects?: IProject[];
    className?: string;
}

interface ISkeletonProjectCardListProps extends IBaseProjectCardListProps {
    isSkeleton: true;
    count: number;
}

export type TProjectCardListProps = IBaseProjectCardListProps | ISkeletonProjectCardListProps;

function ProjectCardList({ isMobile, isSkeleton, count, title, projects, className }: TProjectCardListProps): JSX.Element | null {
    const [t] = useTranslation();

    if (!projects?.length && !isSkeleton) {
        return null;
    }

    const projectCards = projects?.map((project) => <ProjectCard project={project} key={project.uid} />) ?? [];
    if (isSkeleton && count) {
        for (let i = 0; i < count; ++i) {
            projectCards.push(<ProjectCard isSkeleton={true} key={createShortUID()} />);
        }
    }

    if (isMobile) {
        return (
            <Accordion.Item value={makeReactKey(title)} className={cn("border-b-0", className)}>
                <Accordion.Trigger>{t(title)}</Accordion.Trigger>
                <Accordion.Content className="flex flex-col gap-3">{projectCards}</Accordion.Content>
            </Accordion.Item>
        );
    } else {
        return (
            <div className="mt-[calc(theme(spacing.2)_-_theme(spacing.3))] md:mt-4">
                {isSkeleton && count ? null : <h3 className="font-semibold md:mb-2 md:text-lg lg:mb-4 lg:text-2xl">{t(title)}</h3>}
                <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>{projectCards}</div>
            </div>
        );
    }
}

export default ProjectCardList;

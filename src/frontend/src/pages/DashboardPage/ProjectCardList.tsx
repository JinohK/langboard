/* eslint-disable @/max-len */
import { Accordion } from "@/components/base";
import { IProject } from "@/controllers/dashboard/useGetProjects";
import { createShortUID } from "@/core/utils/StringUtils";
import ProjectCard from "@/pages/DashboardPage/ProjectCard";
import { useTranslation } from "react-i18next";

interface IBaseProjectCardListProps {
    isMobile?: boolean;
    isSkeleton?: boolean;
    count?: number;
    title: string;
    projects?: IProject[];
}

interface ISkeletonProjectCardListProps extends IBaseProjectCardListProps {
    isSkeleton: true;
    count: number;
}

export type TProjectCardListProps = IBaseProjectCardListProps | ISkeletonProjectCardListProps;

function ProjectCardList({ isMobile, isSkeleton, count, title, projects }: TProjectCardListProps): JSX.Element | null {
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
            <Accordion.Item value={title.replace(/(\.|\s)/g, "-")} className="border-b-0">
                <Accordion.Trigger>{t(title)}</Accordion.Trigger>
                <Accordion.Content className="flex flex-col gap-3">{projectCards}</Accordion.Content>
            </Accordion.Item>
        );
    } else {
        return (
            <div
                className={
                    isSkeleton && count
                        ? "md:mt-[calc(theme(spacing.2)_-_theme(spacing.5))] lg:mt-[calc(theme(spacing.4)_-_theme(spacing.7))]"
                        : ""
                }
            >
                {isSkeleton && count ? null : (
                    <h3 className="font-semibold md:mb-2 md:text-lg lg:mb-4 lg:text-2xl">{title}</h3>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{projectCards}</div>
            </div>
        );
    }
}

export default ProjectCardList;

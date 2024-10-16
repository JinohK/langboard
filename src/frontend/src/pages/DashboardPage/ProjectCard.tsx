import { Button, Card, IconComponent, Skeleton } from "@/components/base";
import { IProject } from "@/controllers/dashboard/useGetProjects";

interface IBaseProjectCardListProps {
    isSkeleton?: boolean;
    project?: IProject;
}

interface ISkeletonProjectCardListProps extends IBaseProjectCardListProps {
    isSkeleton: true;
}

interface IProjectCardProps extends IBaseProjectCardListProps {
    isSkeleton?: false;
    project: IProject;
}

export type TProjectCardProps = IProjectCardProps | ISkeletonProjectCardListProps;

function ProjectCard({ isSkeleton, project }: TProjectCardProps): JSX.Element {
    let cardClassNames = "";
    let title;
    if (isSkeleton) {
        cardClassNames = "border-transparent shadow-transparent";
        title = <Skeleton className="h-4" />;
    } else {
        title = project!.title;
    }

    return (
        <Card.Root className={cardClassNames}>
            <Card.Header className="relative block pt-3">
                <Card.Title className="text-sm text-gray-500">
                    {project?.group_names.length ? project?.group_names.join(", ") : <>&nbsp;</>}
                </Card.Title>
                <Card.Title>{title}</Card.Title>
                <Button
                    variant={project?.starred ? "default" : "outline"}
                    className="absolute right-2.5 top-1 mt-0"
                    size="icon"
                >
                    <IconComponent icon="star" />
                </Button>
            </Card.Header>
        </Card.Root>
    );
}

export default ProjectCard;

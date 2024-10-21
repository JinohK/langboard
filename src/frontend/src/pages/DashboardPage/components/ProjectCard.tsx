import { Button, Card, IconComponent, Skeleton, Tooltip } from "@/components/base";
import { IProject } from "@/controllers/dashboard/useGetProjects";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUID } from "@/core/utils/StringUtils";

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
    let cardClassNames = "cursor-pointer";
    let groupNames;
    let title;
    let button;
    let outlines;
    if (isSkeleton) {
        cardClassNames = "border-transparent shadow-transparent";
        groupNames = <Skeleton className="inline-block h-3.5 w-1/2" />;
        title = <Skeleton className="inline-block h-4 w-3/4" />;
        button = <Skeleton className="absolute right-2.5 top-1 mt-0 inline-block h-9 w-9 rounded-md" />;
        outlines = [];
        for (let i = 0; i < 6; ++i) {
            outlines.push({
                type: null,
                outlines: <Skeleton className="inline-block h-3.5 w-3/4" />,
                color: <Skeleton className="inline-block h-0.5 w-full rounded-full" />,
            });
        }
    } else {
        groupNames = project!.group_names.length ? project!.group_names.join(", ") : <>&nbsp;</>;
        title = project!.title;
        button = (
            <Button variant={project?.starred ? "default" : "outline"} className="absolute right-2.5 top-1 mt-0" size="icon">
                <IconComponent icon="star" />
            </Button>
        );

        // TODO: Outline, Fix here after implementing task
        outlines = [
            {
                type: "Request",
                outlines: Math.floor(Math.random() * 100),
                color: "bg-blue-500",
            },
            {
                type: "Preparation",
                outlines: Math.floor(Math.random() * 100),
                color: "bg-yellow-500",
            },
            {
                type: "Development",
                outlines: Math.floor(Math.random() * 100),
                color: "bg-green-500",
            },
            {
                type: "Testing",
                outlines: Math.floor(Math.random() * 100),
                color: "bg-pink-500",
            },
            {
                type: "Deployment",
                outlines: Math.floor(Math.random() * 100),
                color: "bg-purple-500",
            },
            {
                type: "Completed",
                outlines: Math.floor(Math.random() * 100),
                color: "bg-gray-500",
            },
        ];
    }

    return (
        <Card.Root className={cardClassNames}>
            <Card.Header className="relative block pt-5">
                <Card.Title className="text-sm text-gray-500">{groupNames}</Card.Title>
                <Card.Title>{title}</Card.Title>
                {button}
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-center gap-1.5">
                {outlines.map((outline) => {
                    if (isSkeleton) {
                        return (
                            <div className="flex min-w-5 flex-col items-center gap-0.5" key={createShortUID()}>
                                {outline.outlines}
                                {outline.color}
                            </div>
                        );
                    } else {
                        return (
                            <Tooltip.Provider delayDuration={400} key={createShortUID()}>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <div className="flex min-w-5 flex-col gap-0.5 text-center">
                                            <span className="text-sm font-semibold">{outline.outlines}</span>
                                            <div className={cn("inline-block h-0.5 w-full rounded-full", outline.color as string)} />
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content side="bottom">{outline.type}</Tooltip.Content>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        );
                    }
                })}
            </Card.Footer>
        </Card.Root>
    );
}

export default ProjectCard;

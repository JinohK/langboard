import { Button, IconComponent, Toast } from "@/components/base";
import useToggleStarProject from "@/controllers/api/dashboard/useToggleStarProject";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IProjectCardStarButtonProps {
    project: Project.TModel;
    isUpdating: bool;
    setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
    refetchAllStarred: () => Promise<unknown>;
    refetchAllProjects: () => Promise<unknown>;
}

const ProjectCardStarButton = memo(({ project, isUpdating, setIsUpdating, refetchAllStarred, refetchAllProjects }: IProjectCardStarButtonProps) => {
    const [t] = useTranslation();
    const { mutate } = useToggleStarProject();
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

    return (
        <Button
            variant={project.starred ? "default" : "outline"}
            className="absolute right-2.5 top-1 mt-0"
            size="icon"
            title={t(`dashboard.${project?.starred ? "Unstar this project" : "Star this project"}`)}
            titleSide="bottom"
            onClick={toggleStar}
            disabled={isUpdating}
        >
            {isUpdating ? <IconComponent icon="loader-circle" size="5" strokeWidth="3" className="animate-spin" /> : <IconComponent icon="star" />}
        </Button>
    );
});

export default ProjectCardStarButton;

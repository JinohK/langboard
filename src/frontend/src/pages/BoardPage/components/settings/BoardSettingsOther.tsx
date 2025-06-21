import { Box, Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import useDeleteProject from "@/controllers/api/board/settings/useDeleteProject";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { deleteProjectModel } from "@/core/helpers/ModelHelper";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardSettingsOther = memo(() => {
    const { project, navigate } = useBoardSettings();
    const [isValidating, setIsValidating] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const [t] = useTranslation();
    const { mutateAsync } = useDeleteProject({ interceptToast: true });

    const deleteProject = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            project_uid: project.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                setTimeout(() => {
                    navigate(ROUTES.DASHBOARD.PROJECTS.ALL, { replace: true });
                }, 0);
                return t("project.settings.successes.Project deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
                deleteProjectModel(ESocketTopic.Board, project.uid);
            },
        });
    };

    const changeOpenState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        setIsOpened(opened);
    };

    return (
        <Flex direction="col" py="4" gap="4" items="end">
            <Popover.Root open={isOpened} onOpenChange={changeOpenState}>
                <Popover.Trigger asChild>
                    <Button variant="destructive" size="sm">
                        {t("project.settings.Delete project")}
                    </Button>
                </Popover.Trigger>
                <Popover.Content>
                    <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                        {t("project.settings.Are you sure you want to delete this project?")}
                    </Box>
                    <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                        {t("project.settings.All data will be lost.")}
                    </Box>
                    <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                        {t("project.settings.This action cannot be undone.")}
                    </Box>
                    <Flex items="center" justify="end" gap="1" mt="2">
                        <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                            {t("common.Cancel")}
                        </Button>
                        <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteProject} isValidating={isValidating}>
                            {t("common.Delete")}
                        </SubmitButton>
                    </Flex>
                </Popover.Content>
            </Popover.Root>
        </Flex>
    );
});

export default BoardSettingsOther;

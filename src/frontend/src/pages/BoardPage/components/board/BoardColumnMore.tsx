import { Box, Button, Flex, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import NotificationSetting from "@/components/NotificationSetting";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useDeleteProjectColumn from "@/controllers/api/board/useDeleteProjectColumn";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectColumn } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnMoreProps {
    column: ProjectColumn.TModel;
    isEditingState: [bool, React.Dispatch<React.SetStateAction<bool>>];
}

const BoardColumnMore = memo(({ column, isEditingState }: IBoardColumnMoreProps) => {
    const [t] = useTranslation();
    const { project, currentUser, hasRoleAction } = useBoard();
    const canEdit = hasRoleAction(Project.ERoleAction.Update);
    const [isEditing] = isEditingState;

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn("size-7", isEditing && "hidden")}
                    title={t("common.More")}
                    {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                >
                    <IconComponent icon="ellipsis-vertical" size="4" />
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-min p-0" {...{ [DISABLE_DRAGGING_ATTR]: "" }}>
                <NotificationSetting.SpecificScopedPopover
                    type="column"
                    currentUser={currentUser}
                    specificUID={column.uid}
                    form={{
                        project_uid: project.uid,
                        column_uid: column.uid,
                    }}
                    triggerProps={{
                        variant: "ghost",
                        className: "w-full justify-start rounded-none",
                    }}
                    iconProps={{
                        className: "hidden",
                    }}
                    showTriggerText
                    onlyPopover
                />
                {canEdit && !column.is_archive && <BoardColumnMoreDelete column={column} />}
            </Popover.Content>
        </Popover.Root>
    );
});
BoardColumnMore.displayName = "Board.ColumnMore";

const BoardColumnMoreDelete = memo(({ column }: Omit<IBoardColumnMoreProps, "isEditingState">) => {
    const [t] = useTranslation();
    const { project } = useBoard();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync } = useDeleteProjectColumn();

    const deleteColumn = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            project_uid: project.uid,
            column_uid: column.uid,
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
                return t("project.successes.Column deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
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
        <Popover.Root open={isOpened} onOpenChange={changeOpenState}>
            <Popover.Trigger asChild>
                <Button variant="ghost" className="w-full justify-start rounded-none">
                    {t("project.Delete column")}
                </Button>
            </Popover.Trigger>
            <Popover.Content {...{ [DISABLE_DRAGGING_ATTR]: "" }}>
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("project.Are you sure you want to delete this column?")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.All cards in this column will be archived.")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("project.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => setIsOpened(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={deleteColumn} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});
BoardColumnMore.displayName = "Board.ColumnMoreDelete";

export default BoardColumnMore;

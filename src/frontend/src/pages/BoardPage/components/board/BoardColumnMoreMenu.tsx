import { Box, Toast } from "@/components/base";
import MoreMenu from "@/components/MoreMenu";
import NotificationSetting from "@/components/NotificationSetting";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useDeleteProjectColumn from "@/controllers/api/board/useDeleteProjectColumn";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectColumn } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnMoreMenuProps {
    column: ProjectColumn.TModel;
    isEditingState: [bool, React.Dispatch<React.SetStateAction<bool>>];
}

const BoardColumnMoreMenu = memo(({ column, isEditingState }: IBoardColumnMoreMenuProps) => {
    const { project, currentUser, hasRoleAction } = useBoard();
    const canEdit = hasRoleAction(Project.ERoleAction.Update);
    const [isEditing] = isEditingState;

    return (
        <MoreMenu.Root
            triggerProps={{ className: cn("size-7", isEditing && "hidden"), ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
            contentProps={{ className: "w-min p-0", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
        >
            <NotificationSetting.SpecificScopedPopover
                type="column"
                currentUser={currentUser}
                specificUID={column.uid}
                modal
                form={{
                    project_uid: project.uid,
                    column_uid: column.uid,
                }}
                triggerProps={{
                    variant: "ghost",
                    className: "w-full justify-start rounded-none px-2 py-1.5 font-normal",
                    role: "menuitem",
                }}
                iconProps={{
                    className: "hidden",
                }}
                showTriggerText
                onlyPopover
            />
            {canEdit && !column.is_archive && <BoardColumnMoreMenuDelete column={column} />}
        </MoreMenu.Root>
    );
});
BoardColumnMoreMenu.displayName = "Board.ColumnMore";

const BoardColumnMoreMenuDelete = memo(({ column }: Omit<IBoardColumnMoreMenuProps, "isEditingState">) => {
    const [t] = useTranslation();
    const { project } = useBoard();
    const { mutateAsync } = useDeleteProjectColumn();

    const deleteColumn = (endCallback: (shouldClose: bool) => void) => {
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
                endCallback(true);
            },
        });
    };

    return (
        <MoreMenu.PopoverItem
            modal
            contentProps={{ align: "center", ...{ [DISABLE_DRAGGING_ATTR]: "" } }}
            menuName={t("project.Delete column")}
            saveText={t("common.Delete")}
            saveButtonProps={{ variant: "destructive" }}
            onSave={deleteColumn}
        >
            <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                {t("project.Are you sure you want to delete this column?")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("project.All cards in this column will be archived.")}
            </Box>
            <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                {t("project.This action cannot be undone.")}
            </Box>
        </MoreMenu.PopoverItem>
    );
});
BoardColumnMoreMenu.displayName = "Board.ColumnMoreDelete";

export default BoardColumnMoreMenu;

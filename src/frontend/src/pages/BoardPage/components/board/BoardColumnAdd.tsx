import { Box, Button, Card, ScrollArea, Toast } from "@/components/base";
import useCreateProjectColumn from "@/controllers/api/board/useCreateProjectColumn";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { Project } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { BoardColumnTitleInput } from "@/pages/BoardPage/components/board/BoardColumnTitle";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardColumnAdd = memo(() => {
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: createProjectColumnMutateAsync } = useCreateProjectColumn();
    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => hasRoleAction(Project.ERoleAction.Update),
        valueType: "input",
        disableNewLine: true,
        save: (value, endCallback) => {
            setIsValidating(true);

            const promise = createProjectColumnMutateAsync({
                project_uid: project.uid,
                name: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Adding..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("project.errors.Project not found."),
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("board.successes.Column added successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                    endCallback();
                },
            });
        },
    });

    const sharedRootClassNames = "my-1 ring-primary";

    return (
        <>
            {!isEditing ? (
                <Button
                    className={cn(sharedRootClassNames, "justify-start rounded-md border-2 border-dashed bg-card p-4 text-card-foreground shadow")}
                    onClick={() => changeMode("edit")}
                >
                    {t("board.Add Column")}
                </Button>
            ) : (
                <Card.Root className={cn(sharedRootClassNames, "w-80 flex-shrink-0 snap-center")}>
                    <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold">
                        <BoardColumnTitleInput
                            isEditing={true}
                            canEdit={true}
                            changeMode={changeMode}
                            columnName={""}
                            disabled={isValidating}
                            inputRef={valueRef}
                        />
                    </Card.Header>
                    <ScrollArea.Root>
                        <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 p-3">
                            <Box pb="2.5" />
                        </Card.Content>
                    </ScrollArea.Root>
                </Card.Root>
            )}
        </>
    );
});
BoardColumnAdd.displayName = "Board.ColumnAdd";

export default BoardColumnAdd;

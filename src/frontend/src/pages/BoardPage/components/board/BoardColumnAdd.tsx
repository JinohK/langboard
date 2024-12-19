import { Box, Button, Card, ScrollArea, Toast } from "@/components/base";
import useCreateProjectColumn from "@/controllers/api/board/useCreateProjectColumn";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { BoardColumnHeaderInput } from "@/pages/BoardPage/components/board/BoardColumnHeader";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const BoardColumnAdd = memo(() => {
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { mutateAsync: createProjectColumnMutateAsync } = useCreateProjectColumn();

    const changeMode = (mode: "edit" | "view") => {
        if (!hasRoleAction(Project.ERoleAction.UPDATE)) {
            return;
        }

        if (mode === "edit") {
            setIsCreating(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return;
        }

        const newValue = inputRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length) {
            setIsCreating(false);
            return;
        }

        setIsValidating(true);

        const promise = createProjectColumnMutateAsync({
            project_uid: project.uid,
            name: newValue,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Adding..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("project.Project not found");
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: () => {
                return t("board.successes.Column added successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsCreating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    const sharedRootClassNames = "my-1 ring-primary";

    return (
        <>
            {!isCreating ? (
                <Button
                    className={cn(sharedRootClassNames, "justify-start rounded-md border-2 border-dashed bg-card p-4 text-card-foreground shadow")}
                    onClick={() => changeMode("edit")}
                >
                    {t("board.Add Column")}
                </Button>
            ) : (
                <Card.Root className={cn(sharedRootClassNames, "w-80 flex-shrink-0 snap-center")}>
                    <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold">
                        <BoardColumnHeaderInput
                            isEditing={true}
                            canEdit={true}
                            changeMode={changeMode}
                            columnName={""}
                            disabled={isValidating}
                            inputRef={inputRef}
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

export default BoardColumnAdd;

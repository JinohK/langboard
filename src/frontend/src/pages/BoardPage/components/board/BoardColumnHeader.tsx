import { Input, Toast } from "@/components/base";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useChangeProjectColumnName from "@/controllers/api/board/useChangeProjectColumnName";
import useProjectColumnNameChangedHandlers from "@/controllers/socket/project/column/useProjectColumnNameChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { Project, ProjectColumn } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnHeaderProps {
    isDragging: bool;
    column: ProjectColumn.Interface;
}

const BoardColumnHeader = memo(({ isDragging, column }: IBoardColumnHeaderProps) => {
    const { selectCardViewType } = useBoardRelationshipController();
    const { project, socket, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [columnName, setColumnName] = useState(column.name);
    const { mutateAsync: changeProjectColumnNameMutateAsync } = useChangeProjectColumnName();
    const handlers = useProjectColumnNameChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            if (data.uid !== column.uid || data.name === column.name) {
                return;
            }

            column.name = data.name;
            setColumnName(data.name);
        },
    });
    useSwitchSocketHandlers({ socket, handlers });
    const canEdit = hasRoleAction(Project.ERoleAction.UPDATE);

    const changeMode = (mode: "edit" | "view") => {
        if (isDragging || !canEdit || !!selectCardViewType) {
            return;
        }

        if (mode === "edit") {
            setIsEditing(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return;
        }

        const newValue = inputRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length || column.name.trim() === newValue) {
            setIsEditing(false);
            return;
        }

        setIsValidating(true);

        const promise = changeProjectColumnNameMutateAsync({
            project_uid: project.uid,
            column_uid: column.uid,
            name: newValue,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
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
            success: (data) => {
                column.name = data.name;
                setColumnName(data.name);
                return t("project.successes.Column name changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <BoardColumnHeaderInput
            isEditing={isEditing}
            viewClassName={canEdit ? "cursor-text" : ""}
            canEdit={!isDragging && canEdit}
            changeMode={changeMode}
            columnName={columnName}
            disabled={isValidating}
            inputRef={inputRef}
        />
    );
});

export interface IBoardColumnHeaderInput {
    isEditing: bool;
    viewClassName?: string;
    canEdit: bool;
    changeMode: (mode: "edit" | "view") => void;
    columnName: string;
    disabled?: bool;
    inputRef: React.RefObject<HTMLInputElement>;
}

export const BoardColumnHeaderInput = memo(
    ({ isEditing, viewClassName, canEdit, changeMode, columnName, disabled, inputRef }: IBoardColumnHeaderInput) => {
        const [t] = useTranslation();

        return (
            <>
                {!isEditing ? (
                    <span
                        {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                        className={cn("truncate", viewClassName)}
                        onClick={(e) => {
                            if (!canEdit) {
                                return;
                            }

                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("edit");
                        }}
                    >
                        {columnName}
                    </span>
                ) : (
                    <Input
                        ref={inputRef}
                        className={cn(
                            "h-auto rounded-none border-x-0 border-t-0 p-0 text-base font-semibold",
                            "focus-visible:border-b-primary focus-visible:ring-0"
                        )}
                        placeholder={t("board.Enter a title")}
                        disabled={disabled}
                        defaultValue={columnName}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onBlur={() => changeMode("view")}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") {
                                return;
                            }

                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("view");
                        }}
                    />
                )}
            </>
        );
    }
);

export default BoardColumnHeader;

import { Input, Toast } from "@/components/base";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useChangeProjectColumnName from "@/controllers/api/board/useChangeProjectColumnName";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectColumn } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";

export interface IBoardColumnTitleProps {
    isDragging: bool;
    column: ProjectColumn.TModel;
    isEditingState: [bool, React.Dispatch<React.SetStateAction<bool>>];
}

const BoardColumnTitle = memo(({ isDragging, column, isEditingState }: IBoardColumnTitleProps) => {
    const { selectCardViewType } = useBoardRelationshipController();
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const columnName = column.useField("name");
    const { mutateAsync: changeProjectColumnNameMutateAsync } = useChangeProjectColumnName();
    const canEdit = hasRoleAction(Project.ERoleAction.Update);
    const { valueRef, isEditing, changeMode } = useChangeEditMode({
        canEdit: () => canEdit && !isDragging && !selectCardViewType,
        valueType: "input",
        disableNewLine: true,
        isEditingState,
        save: (value, endCallback) => {
            setIsValidating(true);

            const promise = changeProjectColumnNameMutateAsync({
                project_uid: project.uid,
                column_uid: column.uid,
                name: value,
            });

            Toast.Add.promise(promise, {
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
                success: () => {
                    return t("project.successes.Column name changed successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                    endCallback();
                },
            });
        },
        originalValue: columnName,
    });

    return (
        <BoardColumnTitleInput
            isEditing={isEditing}
            viewClassName={canEdit ? "cursor-text" : ""}
            canEdit={!isDragging && canEdit}
            changeMode={changeMode}
            columnName={columnName}
            disabled={isValidating}
            inputRef={valueRef}
        />
    );
});

export interface IBoardColumnTitleInput {
    isEditing: bool;
    viewClassName?: string;
    canEdit: bool;
    changeMode: (mode: "edit" | "view") => void;
    columnName: string;
    disabled?: bool;
    inputRef: React.RefObject<HTMLInputElement>;
}

export const BoardColumnTitleInput = memo(
    ({ isEditing, viewClassName, canEdit, changeMode, columnName, disabled, inputRef }: IBoardColumnTitleInput) => {
        const [t] = useTranslation();

        return (
            <>
                {!isEditing ? (
                    <span
                        {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                        className={cn("h-7 truncate", viewClassName)}
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
                            "h-7 rounded-none border-x-0 border-t-0 p-0 pb-1 text-base font-semibold",
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

export default BoardColumnTitle;

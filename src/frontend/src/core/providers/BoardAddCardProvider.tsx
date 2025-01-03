import { Toast } from "@/components/base";
import useCreateCard from "@/controllers/api/board/useCreateCard";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import { Project, ProjectColumn } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { createContext, useContext, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardAddCardContext {
    isEditing: bool;
    setIsEditing: (isEditing: bool) => void;
    isValidating: bool;
    changeMode: (mode: "edit" | "view") => void;
    scrollToBottom: () => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    disableChangeModeAttr: string;
    canWrite: bool;
}

interface IBoardAddCardProps {
    column: ProjectColumn.TModel;
    viewportId: string;
    toLastPage: () => void;
    children: React.ReactNode;
}

const initialContext = {
    isEditing: false,
    setIsEditing: () => {},
    isValidating: false,
    changeMode: () => {},
    scrollToBottom: () => {},
    textareaRef: { current: null },
    disableChangeModeAttr: "data-disable-change-mode",
    canWrite: false,
};

const BoardAddCardContext = createContext<IBoardAddCardContext>(initialContext);

export const BoardAddCardProvider = ({ column, viewportId, toLastPage, children }: IBoardAddCardProps): React.ReactNode => {
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const disableChangeModeAttr = "data-disable-change-mode";
    const canWrite = hasRoleAction(Project.ERoleAction.CARD_WRITE) && !column.isArchiveColumn();
    const { mutateAsync: createCardMutateAsync } = useCreateCard();
    const { valueRef, isEditing, setIsEditing, changeMode } = useChangeEditMode({
        canEdit: () => hasRoleAction(Project.ERoleAction.UPDATE),
        valueType: "textarea",
        disableNewLine: true,
        customStartEditing: () => {
            const pointerDownEvent = (e: PointerEvent) => {
                const target = e.target;
                if (!target || !(target instanceof HTMLElement) || target.closest(`[${disableChangeModeAttr}]`)) {
                    return;
                }

                changeMode("view");
                window.removeEventListener("pointerdown", pointerDownEvent);
            };

            window.addEventListener("pointerdown", pointerDownEvent);

            toLastPage();
            setIsEditing(() => true);

            setTimeout(() => {
                if (valueRef.current) {
                    valueRef.current.focus();
                }
                scrollToBottom();
            }, 0);
        },
        save: (value, endCallback) => {
            setIsValidating(true);

            const promise = createCardMutateAsync({
                project_uid: project.uid,
                column_uid: column.uid,
                title: value,
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
                success: (data) => {
                    const openCard = () => {
                        const card = document.getElementById(`board-card-${data.uid}`);
                        if (!card) {
                            return setTimeout(openCard, 50);
                        }

                        toLastPage();
                        scrollToBottom();
                        card.click();
                    };
                    openCard();
                    return t("board.successes.Card added successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                    endCallback();
                    Toast.Add.dismiss(toastId);
                },
            });
        },
    });

    const scrollToBottom = () => {
        const viewport = document.getElementById(viewportId)!;
        viewport.scrollTo({ top: viewport.scrollHeight });
    };

    return (
        <BoardAddCardContext.Provider
            value={{
                isEditing,
                setIsEditing,
                isValidating,
                changeMode,
                scrollToBottom,
                textareaRef: valueRef,
                disableChangeModeAttr,
                canWrite,
            }}
        >
            {children}
        </BoardAddCardContext.Provider>
    );
};

export const useBoardAddCard = () => {
    const context = useContext(BoardAddCardContext);
    if (!context) {
        throw new Error("useBoardAddCard must be used within a BoardAddCardProvider");
    }
    return context;
};

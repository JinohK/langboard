import { Toast } from "@/components/base";
import useCreateCard from "@/controllers/api/board/useCreateCard";
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
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    disableChangeModeAttr: string;
    canWrite: bool;
}

interface IBoardAddCardProps {
    column: ProjectColumn.TModel;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    toLastPage: () => void;
    children: React.ReactNode;
}

const initialContext = {
    isEditing: false,
    setIsEditing: () => {},
    isValidating: false,
    changeMode: () => {},
    scrollToBottom: () => {},
    textareaRef: { current: null! },
    disableChangeModeAttr: "data-disable-change-mode",
    canWrite: false,
};

const BoardAddCardContext = createContext<IBoardAddCardContext>(initialContext);

export const BoardAddCardProvider = ({ column, viewportRef, toLastPage, children }: IBoardAddCardProps): React.ReactNode => {
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const disableChangeModeAttr = "data-disable-change-mode";
    const canWrite = hasRoleAction(Project.ERoleAction.CardWrite) && !column.is_archive;
    const { mutateAsync: createCardMutateAsync } = useCreateCard({ interceptToast: true });
    const { valueRef, isEditing, setIsEditing, changeMode } = useChangeEditMode({
        canEdit: () => hasRoleAction(Project.ERoleAction.Update),
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

            Toast.Add.promise(promise, {
                loading: t("common.Adding..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler({}, messageRef);

                    handle(error);
                    return messageRef.message;
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
                    return t("successes.Card added successfully.");
                },
                finally: () => {
                    setIsValidating(false);
                    setIsEditing(() => false);
                    endCallback();
                },
            });
        },
    });

    const scrollToBottom = () => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

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

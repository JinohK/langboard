import { Toast } from "@/components/base";
import useCreateCard from "@/controllers/api/board/useCreateCard";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectCard } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { createContext, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardAddCardContext {
    isAddingCard: bool;
    setIsAddingCard: (isAddingCard: bool) => void;
    isValidating: bool;
    changeMode: (mode: "create" | "view") => void;
    scrollToBottom: () => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    disableChangeModeAttr: string;
    canWrite: bool;
}

interface IBoardAddCardProps {
    columnUID: string;
    viewportId: string;
    toLastPage: () => void;
    createdCard: (card: ProjectCard.IBoard) => void;
    children: React.ReactNode;
}

const initialContext = {
    isAddingCard: false,
    setIsAddingCard: () => {},
    isValidating: false,
    changeMode: () => {},
    scrollToBottom: () => {},
    textareaRef: { current: null },
    disableChangeModeAttr: "data-disable-change-mode",
    canWrite: false,
};

const BoardAddCardContext = createContext<IBoardAddCardContext>(initialContext);

export const BoardAddCarddProvider = ({ columnUID, viewportId, toLastPage, createdCard, children }: IBoardAddCardProps): React.ReactNode => {
    const { project, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const disableChangeModeAttr = "data-disable-change-mode";
    const canWrite = hasRoleAction(Project.ERoleAction.CARD_WRITE) && columnUID !== Project.ARCHIVE_COLUMN_UID;
    const { mutateAsync: createCardMutateAsync } = useCreateCard();

    const scrollToBottom = () => {
        const viewport = document.getElementById(viewportId)!;
        viewport.scrollTo({ top: viewport.scrollHeight });
    };

    const changeMode = (mode: "create" | "view") => {
        if (!canWrite) {
            return;
        }

        if (mode === "create") {
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
            setIsAddingCard(true);

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
                scrollToBottom();
            }, 0);
            return;
        }

        const newValue = textareaRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length) {
            setIsAddingCard(false);
            return;
        }

        setIsValidating(true);

        const promise = createCardMutateAsync({
            project_uid: project.uid,
            column_uid: columnUID,
            title: newValue,
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
                createdCard(data.card);
                setTimeout(() => {
                    scrollToBottom();
                    const card = document.getElementById(`board-card-${data.card.uid}`)!;
                    card.click();
                }, 0);
                return t("board.successes.Card added successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsAddingCard(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <BoardAddCardContext.Provider
            value={{
                isAddingCard,
                setIsAddingCard,
                isValidating,
                changeMode,
                scrollToBottom,
                textareaRef,
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

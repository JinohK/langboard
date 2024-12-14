import { Skeleton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import { API_ROUTES } from "@/controllers/constants";
import useCardDescriptionChangedHandlers from "@/controllers/socket/card/useCardDescriptionChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { format } from "@/core/utils/StringUtils";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardDescription() {
    return (
        <div>
            <div className="h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))] text-muted-foreground">
                <Skeleton className="h-[calc(theme(spacing.56)_-_theme(spacing.8))] w-full" />
            </div>
        </div>
    );
}

function BoardCardDescription(): JSX.Element {
    const { projectUID, card, socket, currentUser, currentEditor, setCurrentEditor, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("description");
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const descriptionRef = useRef<IEditorContent>(card.description ?? { content: "" });
    const setValue = (value: IEditorContent) => {
        descriptionRef.current = value;
    };
    const editorName = `${card.uid}-description`;
    const isEditing = useMemo(() => currentEditor === editorName && hasRoleAction(Project.ERoleAction.CARD_UPDATE), [currentEditor]);
    const { on: onCardDescriptionChanged } = useCardDescriptionChangedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.description = data.description;
            setValue(data.description);
            forceUpdate();
        },
    });
    const changeMode = (mode: "edit" | "view") => {
        if (!hasRoleAction(Project.ERoleAction.CARD_UPDATE)) {
            return;
        }

        if (mode === "edit") {
            setCurrentEditor(editorName);
            return;
        }

        if (descriptionRef.current.content.trim() === (card.description?.content ?? "").trim()) {
            setCurrentEditor("");
            return;
        }

        const promise = changeCardDetailsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            description: descriptionRef.current,
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
                card.description = data.description;
                return t("card.Description changed successfully.");
            },
            finally: () => {
                setCurrentEditor("");
                Toast.Add.dismiss(toastId);
            },
        });
    };

    useEffect(() => {
        const { off } = onCardDescriptionChanged();

        return () => {
            off();
        };
    }, []);

    useEffect(() => {
        const stopEditing = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                !isEditing ||
                target.hasAttribute("data-scroll-area-scrollbar") ||
                target.closest("[data-scroll-area-scrollbar]") ||
                target.closest("[data-sonner-toast]") ||
                target.closest("[data-card-description]") ||
                target.closest("[data-radix-popper-content-wrapper") || // Editor's dropdown menu
                target.closest("[data-radix-alert-dialog-content-wrapper]") // Editor's alert dialog
            ) {
                return;
            }

            changeMode("view");
        };

        window.addEventListener("pointerdown", stopEditing);

        return () => {
            window.removeEventListener("pointerdown", stopEditing);
        };
    }, [currentEditor]);

    return (
        <div
            onPointerDown={(e) => {
                const target = e.target as HTMLElement;
                if (isEditing || !target.closest("[data-card-description]")) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                changeMode("edit");
                setTimeout(() => {
                    if (editorElementRef.current) {
                        editorElementRef.current.focus();
                    }
                }, 50);
            }}
            data-card-description
        >
            {isEditing || !!descriptionRef.current.content.trim().length ? (
                <PlateEditor
                    value={descriptionRef.current}
                    mentionableUsers={card.project_members}
                    currentUser={currentUser}
                    className={cn("h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))]", isEditing ? "px-6 py-3" : "")}
                    readOnly={!isEditing}
                    socket={socket}
                    baseSocketEvent="board:card"
                    chatEventKey={`card-description-${card.uid}`}
                    copilotEventKey={`card-description-${card.uid}`}
                    uploadPath={format(API_ROUTES.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: projectUID, card_uid: card.uid })}
                    setValue={setValue}
                    editorElementRef={editorElementRef}
                />
            ) : (
                <div className="h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))] cursor-text text-sm text-muted-foreground">
                    {t("card.No description")}
                </div>
            )}
        </div>
    );
}

export default BoardCardDescription;

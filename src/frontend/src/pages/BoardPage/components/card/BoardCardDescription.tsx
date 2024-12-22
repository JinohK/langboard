import { Box, Skeleton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import { API_ROUTES } from "@/controllers/constants";
import useCardDescriptionChangedHandlers from "@/controllers/socket/card/useCardDescriptionChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useStopEditingClickOutside from "@/core/hooks/useStopEditingClickOutside";
import { Project } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { format } from "@/core/utils/StringUtils";
import { memo, useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardDescription() {
    return (
        <Box>
            <Box h="full" className="min-h-[calc(theme(spacing.56)_-_theme(spacing.8))] text-muted-foreground">
                <Skeleton w="full" className="h-[calc(theme(spacing.56)_-_theme(spacing.8))]" />
            </Box>
        </Box>
    );
}

const BoardCardDescription = memo((): JSX.Element => {
    const { projectUID, card, socket, currentUser, editorsRef, setCurrentEditor, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("description");
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const descriptionRef = useRef<IEditorContent>(card.description ?? { content: "" });
    const setValue = (value: IEditorContent) => {
        descriptionRef.current = value;
    };
    const editorName = `${card.uid}-description`;
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
    const { stopEditing } = useStopEditingClickOutside("[data-card-description]", () => changeMode("view"), isEditing);
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
                return t("card.successes.Description changed successfully.");
            },
            finally: () => {
                setCurrentEditor("");
                Toast.Add.dismiss(toastId);
            },
        });
    };

    editorsRef.current[editorName] = (editing: bool) => {
        if (hasRoleAction(Project.ERoleAction.CARD_UPDATE)) {
            setIsEditing(editing);
        }
    };

    useEffect(() => {
        const { off } = onCardDescriptionChanged();

        return () => {
            off();
        };
    }, []);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        window.addEventListener("pointerdown", stopEditing);

        return () => {
            window.removeEventListener("pointerdown", stopEditing);
        };
    }, [isEditing]);

    return (
        <Box
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
            <PlateEditor
                value={descriptionRef.current}
                mentionableUsers={card.project_members}
                currentUser={currentUser}
                className={cn("h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))]", isEditing ? "px-6 py-3" : "")}
                socket={socket}
                readOnly={!isEditing}
                baseSocketEvent="board:card"
                chatEventKey={`card-description-${card.uid}`}
                copilotEventKey={`card-description-${card.uid}`}
                uploadPath={format(API_ROUTES.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: projectUID, card_uid: card.uid })}
                placeholder={!isEditing ? t("card.No description") : undefined}
                setValue={setValue}
                editorElementRef={editorElementRef}
            />
        </Box>
    );
});

export default BoardCardDescription;

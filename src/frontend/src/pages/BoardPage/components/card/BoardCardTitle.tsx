import { Dialog, Textarea, Toast } from "@/components/base";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import useCardTitleChangedHandlers from "@/controllers/socket/card/useCardTitleChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardTitle(): JSX.Element {
    const { projectUID, card, socket, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("title");
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const canEdit = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const [height, setHeight] = useState(0);
    const { on: onCardTitleChanged, send: sendCardTitleChanged } = useCardTitleChangedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            card.title = data.title;
            forceUpdate();
        },
    });
    const changeMode = (mode: "edit" | "view") => {
        if (!canEdit) {
            return;
        }

        if (mode === "edit") {
            setIsEditing(true);
            setTimeout(() => {
                setHeight(measureTextAreaHeight());
                if (!textareaRef.current) {
                    return;
                }

                textareaRef.current.selectionStart = textareaRef.current.value.length;
                textareaRef.current.selectionEnd = textareaRef.current.value.length;
                textareaRef.current.focus();
            }, 0);
            return;
        }

        const newValue = textareaRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length || card.title.trim() === newValue) {
            setIsEditing(false);
            return;
        }

        const promise = changeCardDetailsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            title: newValue,
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
            success: () => {
                card.title = newValue;
                sendCardTitleChanged({ card_uid: card.uid, title: newValue });
                return t("card.Description changed successfully.");
            },
            finally: () => {
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    useEffect(() => {
        const { off } = onCardTitleChanged();

        return () => {
            off();
        };
    }, []);

    const measureTextAreaHeight = () => {
        const cloned = textareaRef.current!.cloneNode(true) as HTMLTextAreaElement;
        cloned.style.width = `${textareaRef.current!.offsetWidth}px`;
        cloned.style.height = "0px";
        document.body.appendChild(cloned);
        const height = cloned.scrollHeight;
        document.body.removeChild(cloned);
        cloned.remove();
        return height;
    };

    return (
        <Dialog.Title className="mr-7 cursor-text text-2xl" onClick={() => changeMode("edit")}>
            {!isEditing ? (
                <span className="break-all">{card.title}</span>
            ) : (
                <Textarea
                    ref={textareaRef}
                    className={cn(
                        "min-h-8 resize-none break-all rounded-none border-x-0 border-t-0 p-0 text-2xl scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    style={{ height }}
                    defaultValue={card.title}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("view");
                            return;
                        }

                        setHeight(measureTextAreaHeight());
                    }}
                    onKeyUp={() => {
                        setHeight(measureTextAreaHeight());
                    }}
                />
            )}
        </Dialog.Title>
    );
}

export default BoardCardTitle;

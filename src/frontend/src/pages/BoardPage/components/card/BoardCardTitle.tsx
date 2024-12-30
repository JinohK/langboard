import { Dialog, Skeleton, Textarea, Toast } from "@/components/base";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn, measureTextAreaHeight } from "@/core/utils/ComponentUtils";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardTitle() {
    return (
        <Dialog.Title>
            <Skeleton h="8" className="w-1/3" />
        </Dialog.Title>
    );
}

function BoardCardTitle(): JSX.Element {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("title");
    const [isEditing, setIsEditing] = useState(false);
    const title = card.useField("title");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const canEdit = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const [height, setHeight] = useState(0);

    const changeMode = (mode: "edit" | "view") => {
        if (!canEdit) {
            return;
        }

        if (mode === "edit") {
            setIsEditing(true);
            setTimeout(() => {
                setHeight(measureTextAreaHeight(textareaRef.current!));
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
        if (!newValue.length || title.trim() === newValue) {
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
                return t("card.successes.Title changed successfully.");
            },
            finally: () => {
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Dialog.Title className="mr-7 cursor-text text-2xl" onClick={() => changeMode("edit")}>
            {!isEditing ? (
                <span className="break-all">{title}</span>
            ) : (
                <Textarea
                    ref={textareaRef}
                    className={cn(
                        "min-h-8 resize-none break-all rounded-none border-x-0 border-t-0 p-0 text-2xl scrollbar-hide",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    style={{ height }}
                    defaultValue={title}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onChange={() => {
                        setHeight(measureTextAreaHeight(textareaRef.current!));
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("view");
                            return;
                        }
                    }}
                />
            )}
        </Dialog.Title>
    );
}

export default BoardCardTitle;

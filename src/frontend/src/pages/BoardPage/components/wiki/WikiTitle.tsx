import { Box, Textarea, Toast } from "@/components/base";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn, measureTextAreaHeight } from "@/core/utils/ComponentUtils";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiTitleProps {
    wiki: ProjectWiki.TModel;
}

const WikiTitle = memo(({ wiki }: IWikiTitleProps) => {
    const { projectUID, canAccessWiki } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("title");
    const [isEditing, setIsEditing] = useState(false);
    const title = wiki.useField("title");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const canEdit = canAccessWiki(false, wiki.uid);
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
        if (!newValue.length || wiki.title.trim() === newValue) {
            setIsEditing(false);
            return;
        }

        const promise = changeWikiDetailsMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
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
                return t("wiki.successes.Title changed successfully.");
            },
            finally: () => {
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <Box p="2">
            {!isEditing ? (
                <h1 className="min-h-8 cursor-text break-all border-b border-border text-xl md:text-2xl" onClick={() => changeMode("edit")}>
                    {title}
                </h1>
            ) : (
                <Textarea
                    ref={textareaRef}
                    className={cn(
                        "min-h-8 resize-none break-all rounded-none border-x-0 border-t-0 p-0 pb-px text-xl md:text-2xl",
                        "scrollbar-hide focus-visible:border-b-primary focus-visible:ring-0"
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
        </Box>
    );
});

export default WikiTitle;

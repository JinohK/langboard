import { Textarea, Toast } from "@/components/base";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import useBoardWikiTitleChangedHandlers from "@/controllers/socket/wiki/useBoardWikiTitleChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiTitleProps {
    wiki: ProjectWiki.Interface;
}

const WikiTitle = memo(({ wiki }: IWikiTitleProps) => {
    const { projectUID, socket, currentUser, canAccessWiki, setTitleMapRef } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("title");
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const canEdit = canAccessWiki(false, wiki.uid);
    const [height, setHeight] = useState(0);
    const { on: onBoardWikiTitleChanged } = useBoardWikiTitleChangedHandlers({
        socket,
        projectUID,
        wikiUID: wiki.uid,
        callback: (data) => {
            wiki.title = data.title;
            setTitleMapRef.current[wiki.uid]?.(data.title);
            forceUpdate();
        },
    });
    const { on: onBoardPrivateWikiTitleChanged } = useBoardWikiTitleChangedHandlers({
        socket,
        projectUID,
        wikiUID: wiki.uid,
        username: currentUser.username,
        callback: (data) => {
            wiki.title = data.title;
            setTitleMapRef.current[wiki.uid]?.(data.title);
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
        if (!newValue.length || wiki.title.trim() === newValue) {
            setTitleMapRef.current[wiki.uid]?.(wiki.title);
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
            success: (data) => {
                wiki.title = data.title;
                setTitleMapRef.current[wiki.uid]?.(data.title);
                return t("wiki.Title changed successfully.");
            },
            finally: () => {
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    useEffect(() => {
        const { off: offBoardWikiTitleChanged } = onBoardWikiTitleChanged();
        const { off: offBoardPrivateWikiTitleChanged } = onBoardPrivateWikiTitleChanged();

        return () => {
            offBoardWikiTitleChanged();
            offBoardPrivateWikiTitleChanged();
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
        <div className="p-2">
            {!isEditing ? (
                <h1 className="min-h-8 cursor-text text-xl md:text-2xl" onClick={() => changeMode("edit")}>
                    {wiki.title}
                </h1>
            ) : (
                <Textarea
                    ref={textareaRef}
                    className={cn(
                        "min-h-8 resize-none break-all rounded-none border-x-0 border-t-0 p-0 text-xl scrollbar-hide md:text-2xl",
                        "focus-visible:border-b-primary focus-visible:ring-0"
                    )}
                    style={{ height }}
                    defaultValue={wiki.title}
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
                        setTitleMapRef.current[wiki.uid]?.(textareaRef.current!.value);
                    }}
                    onKeyUp={() => {
                        setHeight(measureTextAreaHeight());
                        setTitleMapRef.current[wiki.uid]?.(textareaRef.current!.value);
                    }}
                />
            )}
        </div>
    );
});

export default WikiTitle;

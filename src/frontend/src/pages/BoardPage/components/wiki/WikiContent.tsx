import { Box, Flex, Skeleton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import UserAvatarList from "@/components/UserAvatarList";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import { API_ROUTES, SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import subscribeEditorSocketEvents from "@/core/helpers/subscribeEditorSocketEvents";
import useStopEditingClickOutside from "@/core/hooks/useStopEditingClickOutside";
import { ProjectWiki } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { format } from "@/core/utils/StringUtils";
import WikiPrivateOption, { SkeletonWikiPrivateOption } from "@/pages/BoardPage/components/wiki/WikiPrivateOption";
import WikiTitle from "@/pages/BoardPage/components/wiki/WikiTitle";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IWikiContentProps {
    wiki: ProjectWiki.TModel;
    changeTab: (uid: string) => void;
}

export function SkeletonWikiContent() {
    return (
        <Box mt="2">
            <SkeletonWikiPrivateOption />
            <Box p="2">
                <Skeleton h="8" className="w-2/3 md:w-1/3" />
            </Box>
            <Box position="relative" px="6" py="3" className="min-h-[calc(100vh_-_theme(spacing.56))]">
                <Skeleton position="absolute" className="h-3/5 w-4/5 md:w-3/5" />
            </Box>
        </Box>
    );
}

const WikiContent = memo(({ wiki, changeTab }: IWikiContentProps) => {
    const { projectUID, projectMembers, currentUser, socket, editorsRef, setCurrentEditor } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("content");
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserUIDs, setEditingUserUIDs] = useState<string[]>([]);
    const content = wiki.useField("content");
    const valueRef = useRef<IEditorContent>(content);
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const { stopEditing } = useStopEditingClickOutside("[data-wiki-content]", () => changeMode("view"), isEditing);
    const changeMode = (mode: "edit" | "view") => {
        if (mode === "edit") {
            setCurrentEditor(wiki.uid);
            return;
        }

        if ((valueRef.current?.content ?? "").trim() === (content?.content ?? "").trim()) {
            setCurrentEditor("");
            return;
        }

        const promise = changeWikiDetailsMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
            content: valueRef.current,
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
                return t("wiki.successes.Content changed successfully.");
            },
            finally: () => {
                setCurrentEditor("");
                Toast.Add.dismiss(toastId);
            },
        });
    };

    editorsRef.current[wiki.uid] = (editing: bool) => {
        setIsEditing(editing);
    };

    useEffect(() => {
        let unsubscribe: () => void = () => {};
        setTimeout(() => {
            unsubscribe = subscribeEditorSocketEvents({
                socket,
                topic: ESocketTopic.BoardWiki,
                topicId: projectUID,
                onEventNames: SOCKET_SERVER_EVENTS.BOARD.WIKI,
                eventNameFormatMap: { uid: wiki.uid },
                eventKey: `wiki-content-editor-${wiki.uid}`,
                getUsersSendEvent: SOCKET_CLIENT_EVENTS.BOARD.WIKI.EDITOR_USERS,
                getUsersSendEventData: { uid: wiki.uid },
                startCallback: (userUIDs) => setEditingUserUIDs(userUIDs),
                stopCallback: (userUIDs) => setEditingUserUIDs(userUIDs),
            });
        }, 0);

        return () => {
            unsubscribe();
        };
    }, [subscribeEditorSocketEvents]);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        window.addEventListener("pointerdown", stopEditing);

        return () => {
            window.removeEventListener("pointerdown", stopEditing);
        };
    }, [isEditing]);

    const editingUsers = editingUserUIDs.filter((uid) => uid !== currentUser.uid);

    return (
        <Box className="max-h-[calc(100vh_-_theme(spacing.36))] overflow-y-auto">
            <WikiPrivateOption wiki={wiki} changeTab={changeTab} />
            <WikiTitle wiki={wiki} />
            <Box
                onPointerDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (isEditing || !target.closest("[data-wiki-content]")) {
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
                position="relative"
                data-wiki-content
            >
                <PlateEditor
                    value={content}
                    currentUser={currentUser}
                    mentionableUsers={projectMembers}
                    className={cn(
                        "h-full px-6 py-3",
                        isEditing
                            ? "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.2))] min-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.2))]"
                            : "min-h-[calc(100vh_-_theme(spacing.56))]"
                    )}
                    readOnly={!isEditing}
                    socket={socket}
                    baseSocketEvent="board:wiki"
                    chatEventKey={`wiki-content-${wiki.uid}`}
                    copilotEventKey={`wiki-content-${wiki.uid}`}
                    placeholder={!isEditing ? t("wiki.No content") : undefined}
                    uploadPath={format(API_ROUTES.BOARD.WIKI.UPLOAD, { uid: projectUID, wiki_uid: wiki.uid })}
                    setValue={setValue}
                    editorElementRef={editorElementRef}
                />
                {editingUsers.length > 0 && (
                    <Flex items="center" justify="end" gap="2" mb="1" mr="1" position="fixed" bottom="1" right="2">
                        <UserAvatarList
                            users={editingUsers.map((userUID) => projectMembers.find((user) => user.uid === userUID)!)}
                            maxVisible={3}
                            size="xs"
                            spacing="1"
                            listAlign="end"
                        />
                        <span className="text-muted-foreground/70">{t(`common.${editingUsers.length === 1 ? "is" : "are"} editing...`)}</span>
                    </Flex>
                )}
            </Box>
        </Box>
    );
});

export default WikiContent;

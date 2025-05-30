import { Box, Button, Flex, Skeleton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeWikiDetails from "@/controllers/api/wiki/useChangeWikiDetails";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { ProjectWiki, User } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import WikiPrivateOption, { SkeletonWikiPrivateOption } from "@/pages/BoardPage/components/wiki/WikiPrivateOption";
import WikiTitle from "@/pages/BoardPage/components/wiki/WikiTitle";
import { memo, useEffect, useMemo, useRef } from "react";
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
    const { projectUID, projectMembers, projectBots, currentUser, editorsRef, setCurrentEditor, navigate } = useBoardWiki();
    const [t] = useTranslation();
    const { mutateAsync: changeWikiDetailsMutateAsync } = useChangeWikiDetails("content");
    const isPublic = wiki.useField("is_public");
    const assignedMembers = wiki.useForeignField<User.TModel>("assigned_members");
    const mentionables = useMemo(
        () => [...(isPublic ? projectMembers : assignedMembers), ...projectBots.map((bot) => bot.as_user)],
        [isPublic, assignedMembers, projectMembers, projectBots]
    );
    const content = wiki.useField("content");
    const editorComponentRef = useRef<HTMLDivElement>(null);
    const { valueRef, isEditing, setIsEditing, changeMode } = useChangeEditMode({
        canEdit: () => true,
        customStartEditing: () => setCurrentEditor(wiki.uid),
        valueType: "editor",
        canEmpty: true,
        save: (value) => {
            const promise = changeWikiDetailsMutateAsync({
                project_uid: projectUID,
                wiki_uid: wiki.uid,
                content: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                                setTimeout(() => {
                                    navigate(ROUTES.BOARD.WIKI(projectUID));
                                }, 0);
                                return t("wiki.errors.Can't access this wiki.");
                            },
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("wiki.successes.Content changed successfully.");
                },
                finally: () => {
                    setCurrentEditor("");
                },
            });
        },
        originalValue: content,
    });
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const { startEditing, stopEditing } = useToggleEditingByClickOutside("[data-wiki-content]", changeMode, isEditing);

    editorsRef.current[wiki.uid] = (editing: bool) => {
        setIsEditing(editing);
    };

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
        <Box className="max-h-[calc(100vh_-_theme(spacing.36))] overflow-y-auto">
            <WikiPrivateOption wiki={wiki} changeTab={changeTab} />
            <WikiTitle wiki={wiki} />
            <Box onPointerDown={startEditing} position="relative" data-wiki-content>
                <PlateEditor
                    value={content}
                    currentUser={currentUser}
                    mentionables={mentionables}
                    className={cn(
                        "h-full px-6 py-3",
                        isEditing
                            ? cn(
                                  "max-h-[calc(100vh_-_theme(spacing.72)_-_theme(spacing.6)_-_1px)]",
                                  "min-h-[calc(100vh_-_theme(spacing.72)_-_theme(spacing.6)_-_1px)]"
                              )
                            : "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.5))] min-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.5))]"
                    )}
                    readOnly={!isEditing}
                    editorType="wiki-content"
                    form={{
                        project_uid: projectUID,
                        wiki_uid: wiki.uid,
                    }}
                    placeholder={!isEditing ? t("wiki.No content") : undefined}
                    setValue={setValue}
                    editorComponentRef={editorComponentRef}
                />
            </Box>
            <Flex items="center" justify="start" pt="2" mx="2" gap="2" className="border-t">
                <Button variant="secondary" onClick={() => navigate(ROUTES.BOARD.WIKI_ACTIVITY(projectUID, wiki.uid))}>
                    {t("board.Activity")}
                </Button>
                <Button variant="secondary" onClick={() => navigate(ROUTES.BOARD.WIKI_METADATA(projectUID, wiki.uid))}>
                    {t("metadata.Metadata")}
                </Button>
            </Flex>
        </Box>
    );
});

export default WikiContent;

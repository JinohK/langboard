import { Box, Skeleton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import useChangeCardDetails from "@/controllers/api/card/useChangeCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeEditMode from "@/core/hooks/useChangeEditMode";
import useToggleEditingByClickOutside from "@/core/hooks/useToggleEditingByClickOutside";
import { Project } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useMemo, useReducer, useRef } from "react";
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
    const { projectUID, card, currentUser, editorsRef, setCurrentEditor, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const { mutateAsync: changeCardDetailsMutateAsync } = useChangeCardDetails("description", { interceptToast: true });
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const editorComponentRef = useRef<HTMLDivElement | null>(null);
    const projectMembers = card.useForeignField("project_members");
    const projectBots = card.useForeignField("project_bots");
    const mentionables = useMemo(() => [...projectMembers, ...projectBots.map((bot) => bot.as_user)], [projectMembers, projectBots]);
    const description = card.useField("description");
    const editorName = `${card.uid}-description`;
    const { valueRef, isEditing, setIsEditing, changeMode } = useChangeEditMode({
        canEdit: () => hasRoleAction(Project.ERoleAction.CardUpdate),
        customStartEditing: () => {
            setCurrentEditor(editorName);
            setTimeout(() => {
                editorComponentRef.current?.focus();
            }, 0);
        },
        valueType: "editor",
        canEmpty: true,
        save: (value) => {
            const promise = changeCardDetailsMutateAsync({
                project_uid: projectUID,
                card_uid: card.uid,
                description: value,
            });

            Toast.Add.promise(promise, {
                loading: t("common.Changing..."),
                error: (error) => {
                    const messageRef = { message: "" };
                    const { handle } = setupApiErrorHandler({}, messageRef);

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    return t("successes.Description changed successfully.");
                },
                finally: () => {
                    setCurrentEditor("");
                },
            });
        },
        originalValue: description,
    });
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const { startEditing, stopEditing } = useToggleEditingByClickOutside("[data-card-description]", changeMode, isEditing);

    editorsRef.current[editorName] = (editing: bool) => {
        if (hasRoleAction(Project.ERoleAction.CardUpdate)) {
            setIsEditing(editing);
        }
    };

    useEffect(() => {
        setValue(description);
        forceUpdate();
    }, [description]);

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
        <Box onPointerDown={startEditing} data-card-description>
            <PlateEditor
                value={valueRef.current}
                mentionables={mentionables}
                currentUser={currentUser}
                className={cn("h-full min-h-[calc(theme(spacing.56)_-_theme(spacing.8))]", isEditing ? "px-6 py-3" : "")}
                readOnly={!isEditing}
                editorType="card-description"
                form={{
                    project_uid: projectUID,
                    card_uid: card.uid,
                }}
                placeholder={!isEditing ? t("card.No description") : undefined}
                setValue={setValue}
                editorComponentRef={editorComponentRef}
            />
        </Box>
    );
});

export default BoardCardDescription;

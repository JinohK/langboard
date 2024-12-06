import { Button, Flex, IconComponent, Progress } from "@/components/base";
import useUploadCardAttachment from "@/controllers/api/card/attachment/useUploadCardAttachment";
import useCardAttachmentUploadedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentUploadedHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { formatBytes } from "@/core/utils/StringUtils";
import { IAttachedFile } from "@/pages/BoardPage/components/card/action/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

interface IBoardCardActionAttachedFileProps {
    attachedFile: IAttachedFile;
    deleteFile: (key: string) => void;
    isOverlay?: bool;
}

interface IBoardCardActionAttachedFileDragData {
    type: "AttachedFile";
    data: IAttachedFile;
}

const BoardCardActionAttachedFile = memo(({ attachedFile, deleteFile, isOverlay }: IBoardCardActionAttachedFileProps) => {
    const { projectUID, card, socket } = useBoardCard();
    const [t] = useTranslation();
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isError, setIsError] = useState(false);
    const { mutateAsync: uploadCardAttachmentMutateAsync } = useUploadCardAttachment();
    const { send: sendCardAttachmentUploaded } = useCardAttachmentUploadedHandlers({ socket });
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: attachedFile.key,
        data: {
            type: "AttachedFile",
            data: attachedFile,
        } satisfies IBoardCardActionAttachedFileDragData,
        attributes: {
            roleDescription: "AttachedFile",
        },
    });
    attachedFile.upload = async () => {
        setIsUploading(true);

        try {
            const newFile = await uploadCardAttachmentMutateAsync({
                project_uid: projectUID,
                card_uid: card.uid,
                attachment: attachedFile.file,
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total ?? 0;
                    const progress = (progressEvent.loaded / total) * 100;
                    setProgress(progress);
                },
            });
            newFile.order = card.attachments.length;
            card.attachments.push(newFile);

            sendCardAttachmentUploaded({
                model_id: newFile.model_id,
            });
        } catch {
            setIsError(true);
        }
    };

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        variants: {
            base: "text-left text-sm",
            dragging: {
                over: "border-b-2 border-primary/50 [&>div]:opacity-30",
                overlay: "",
            },
        },
    });

    const props = {
        style,
        className: variants({
            dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }),
        ref: setNodeRef,
    };

    return (
        <Flex gap="2" w="full" items="center" {...props}>
            {!isUploading && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-5"
                    title={t("common.Drag to reorder")}
                    disabled={isUploading}
                    {...attributes}
                    {...listeners}
                >
                    <IconComponent icon="grip-vertical" size="4" />
                </Button>
            )}
            <Flex items="center" justify="center" inline w="12" h="9" className="rounded-sm bg-muted text-xs">
                {attachedFile.file.name.split(".").at(-1)?.toUpperCase() ?? "FILE"}
            </Flex>
            <Flex direction="col" w="full" className="max-w-[calc(100%_-_theme(spacing.32))]">
                <div className="truncate">{attachedFile.file.name}</div>
                <div className="truncate text-xs text-muted-foreground/70">
                    {!isUploading ? (
                        formatBytes(attachedFile.file.size, { decimals: 1 })
                    ) : (
                        <Progress value={progress} height="2" indicatorClassName={isError ? "bg-destructive" : ""} />
                    )}
                </div>
            </Flex>
            {!isUploading && (
                <Button variant="destructive" size="icon-sm" className="size-6" disabled={isUploading} onClick={() => deleteFile(attachedFile.key)}>
                    <IconComponent icon="trash-2" size="4" />
                </Button>
            )}
        </Flex>
    );
});

export default BoardCardActionAttachedFile;

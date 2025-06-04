import { Box, Button, Flex, IconComponent, Skeleton } from "@/components/base";
import CachedImage from "@/components/CachedImage";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import { Project, ProjectCardAttachment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { formatDateDistance } from "@/core/utils/StringUtils";
import BoardCardAttachmentMoreMenu from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentMoreMenu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import mimeTypes from "react-native-mime-types";
import { tv } from "tailwind-variants";

export interface IBoardCardAttachmentProps {
    attachment: ProjectCardAttachment.TModel;
    openPreview: () => void;
    isOverlay?: bool;
}

interface IBoardCardAttachmentDragData extends ISortableDragData<ProjectCardAttachment.TModel> {
    type: "Attachment";
}

export function SkeletonBoardCardAttachment() {
    return (
        <Flex items="center" justify="between">
            <Flex items="center" gap={{ initial: "1.5", sm: "2.5" }}>
                <Skeleton h={{ initial: "8", sm: "12" }} w={{ initial: "12", sm: "16" }} rounded="sm" className="bg-muted" />
                <Box ml={{ initial: "1", sm: "0" }}>
                    <Box textSize="sm">
                        <Skeleton h="5" w="28" />
                    </Box>
                    <Box textSize="xs" className="text-muted-foreground">
                        <Skeleton h="5" w="20" />
                    </Box>
                </Box>
            </Flex>
        </Flex>
    );
}

function BoardCardAttachment({ attachment, openPreview, isOverlay }: IBoardCardAttachmentProps): JSX.Element {
    const { currentUser, hasRoleAction } = useBoardCard();
    const [t, i18n] = useTranslation();
    const name = attachment.useField("name");
    const url = attachment.useField("url");
    const mimeType = mimeTypes.lookup(url) || "file";
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: attachment.uid,
        data: {
            type: "Attachment",
            data: attachment,
        } satisfies IBoardCardAttachmentDragData,
        attributes: {
            roleDescription: "Attachment",
        },
    });
    const [isValidating, setIsValidating] = useState(false);
    const canReorder = hasRoleAction(Project.ERoleAction.CardUpdate);
    const canEdit = currentUser.uid === attachment.user.uid || hasRoleAction(Project.ERoleAction.CardUpdate);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        variants: {
            dragging: {
                over: "border-b-2 border-primary/50 [&>div]:opacity-30",
                overlay: "",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (canReorder) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            ref: setNodeRef,
        };
    } else {
        props = {
            className: variants(),
        };
    }

    return (
        <Flex items="center" justify="between" {...props}>
            <Flex items="center" gap={{ initial: "1.5", sm: "2.5" }}>
                {canReorder && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-5 sm:size-8"
                        title={t("common.Drag to reorder")}
                        disabled={isValidating}
                        {...attributes}
                        {...listeners}
                    >
                        <IconComponent icon="grip-vertical" size="4" />
                    </Button>
                )}
                <Flex
                    items="center"
                    justify="center"
                    cursor="default"
                    inline
                    w={{ initial: "12", sm: "16" }}
                    h={{ initial: "8", sm: "12" }}
                    rounded="sm"
                    className="bg-muted"
                    onClick={openPreview}
                >
                    {mimeType.startsWith("image/") ? (
                        <CachedImage src={url} alt={mimeType} h="full" className="min-w-full" />
                    ) : (
                        (name.split(".").at(-1)?.toUpperCase() ?? "FILE")
                    )}
                </Flex>
                <Box ml={{ initial: "1", sm: "0" }}>
                    <Box textSize="sm">{name}</Box>
                    <Box textSize="xs" className="text-muted-foreground">
                        {t("card.Added {date}", { date: formatDateDistance(i18n, t, attachment.created_at) })}
                    </Box>
                </Box>
            </Flex>
            {canEdit && <BoardCardAttachmentMoreMenu attachment={attachment} isValidating={isValidating} setIsValidating={setIsValidating} />}
        </Flex>
    );
}

export default BoardCardAttachment;

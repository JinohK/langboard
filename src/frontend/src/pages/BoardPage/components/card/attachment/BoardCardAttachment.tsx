import { Button, Flex, IconComponent } from "@/components/base";
import CachedImage from "@/components/CachedImage";
import { IBoardCardAttachment } from "@/controllers/api/card/useGetCardDetails";
import useCardAttachmentNameChangedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentNameChangedHandlers";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { formatDateDistance } from "@/core/utils/StringUtils";
import BoardCardAttachmentMore from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentMore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import mimeTypes from "react-native-mime-types";
import { tv } from "tailwind-variants";

export interface IBoardCardAttachmentProps {
    attachment: IBoardCardAttachment;
    deletedAttachment: (uid: string) => void;
    isOverlay?: bool;
}

interface IBoardCardAttachmentDragData {
    type: "Attachment";
    data: IBoardCardAttachment;
}

function BoardCardAttachment({ attachment, deletedAttachment, isOverlay }: IBoardCardAttachmentProps): JSX.Element {
    const { socket, currentUser, hasRoleAction } = useBoardCard();
    const [t, i18n] = useTranslation();
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const mimeType = mimeTypes.lookup(attachment.url) || "file";
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
    const { on: onCardAttachmentNameChanged } = useCardAttachmentNameChangedHandlers({
        socket,
        attachmentUID: attachment.uid,
        callback: (data) => {
            attachment.name = data.name;
            forceUpdate();
        },
    });
    const canReorder = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
    const canEdit = currentUser.id === attachment.user.id || hasRoleAction(Project.ERoleAction.CARD_UPDATE);

    useEffect(() => {
        const { off } = onCardAttachmentNameChanged();

        return () => {
            off();
        };
    }, []);

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
                    inline
                    w={{ initial: "12", sm: "16" }}
                    h={{ initial: "8", sm: "12" }}
                    className="rounded-sm bg-muted"
                >
                    {mimeType.startsWith("image/") ? (
                        <CachedImage src={attachment.url} alt={mimeType} h="full" className="min-w-full" />
                    ) : (
                        (attachment.name.split(".").at(-1)?.toUpperCase() ?? "FILE")
                    )}
                </Flex>
                <div className="ml-1 sm:ml-0">
                    <div className="text-sm">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {t("card.Added {date}", { date: formatDateDistance(i18n, t, attachment.created_at) })}
                    </div>
                </div>
            </Flex>
            {canEdit && (
                <BoardCardAttachmentMore
                    attachment={attachment}
                    isValidating={isValidating}
                    setIsValidating={setIsValidating}
                    deletedAttachment={deletedAttachment}
                    update={forceUpdate}
                />
            )}
        </Flex>
    );
}

export default BoardCardAttachment;

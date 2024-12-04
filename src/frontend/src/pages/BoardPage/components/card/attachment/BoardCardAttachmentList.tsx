import { Button, Collapsible, Flex, Toast } from "@/components/base";
import useChangeCardAttachmentOrder from "@/controllers/api/card/attachment/useChangeCardAttachmentOrder";
import { IBoardCardAttachment } from "@/controllers/api/card/useGetCardDetails";
import useCardAttachmentDeletedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentDeletedHandlers";
import useCardAttachmentUploadedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentUploadedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardAttachment from "@/pages/BoardPage/components/card/attachment/BoardCardAttachment";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

function BoardCardAttachmentList(): JSX.Element {
    const [t] = useTranslation();
    const { projectUID, card, socket } = useBoardCard();
    const { mutate: changeCardAttachmentOrderMutate } = useChangeCardAttachmentOrder();
    const {
        columns: attachments,
        setColumns: setAttachments,
        reorder: reorderColumns,
        sendColumnOrderChanged,
    } = useReorderColumn({
        type: "BoardCardAttachment",
        eventNameParams: { uid: card.uid },
        columns: card.attachments,
        socket,
    });
    const attachmentsUIDs = useMemo(() => attachments.map((attachment) => attachment.uid), [attachments]);
    const dndContextId = useId();
    const deletedAttachment = (uid: string) => {
        setAttachments((prev) => prev.filter((attachment) => attachment.uid !== uid));
    };
    const { on: onCardAttachmentUploaded } = useCardAttachmentUploadedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            setAttachments((prev) => {
                const newAttachments = [...prev];
                if (!prev.some((attachment) => attachment.uid === data.attachment.uid)) {
                    newAttachments.push(data.attachment);
                }

                return newAttachments.sort((a, b) => a.order - b.order).map((attachment, i) => ({ ...attachment, order: i }));
            });
        },
    });
    const { on: onCardAttachmentDeleted } = useCardAttachmentDeletedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            deletedAttachment(data.uid);
        },
    });
    const {
        activeColumn: activeAttachment,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOver,
    } = useColumnRowSortable<IBoardCardAttachment, IBoardCardAttachment>({
        columnDragDataType: "Attachment",
        rowDragDataType: "FakeAttachment",
        columnCallbacks: {
            onDragEnd: (originalAttachment, index) => {
                if (!reorderColumns(originalAttachment, index)) {
                    return;
                }

                changeCardAttachmentOrderMutate(
                    { project_uid: projectUID, card_uid: card.uid, attachment_uid: originalAttachment.uid, order: index },
                    {
                        onSuccess: () => {
                            sendColumnOrderChanged({
                                card_uid: card.uid,
                                uid: originalAttachment.uid,
                                order: index,
                            });
                        },
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    setAttachments((prev) =>
                                        arrayMove(prev, originalAttachment.order, index).map((attachment, i) => ({ ...attachment, order: i }))
                                    );
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
        },
        transformContainerId: () => "",
    });
    const [isOpened, setIsOpened] = useState(false);

    useEffect(() => {
        const { off: offCardAttachmentUploaded } = onCardAttachmentUploaded();
        const { off: offCardAttachmentDeleted } = onCardAttachmentDeleted();

        return () => {
            offCardAttachmentUploaded();
            offCardAttachmentDeleted();
        };
    }, []);

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <SortableContext items={attachmentsUIDs} strategy={verticalListSortingStrategy}>
                <Flex direction="col" gap="2">
                    {attachments.slice(0, 5).map((attachment) => (
                        <BoardCardAttachment
                            key={`board-card-${card.uid}-attachment-${attachment.uid}`}
                            attachment={attachment}
                            deletedAttachment={deletedAttachment}
                        />
                    ))}
                </Flex>
                {attachments.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <Flex direction="col" gap="2" mt="2">
                                {attachments.slice(5).map((attachment) => (
                                    <BoardCardAttachment
                                        key={`board-card-${card.uid}-attachment-${attachment.uid}`}
                                        attachment={attachment}
                                        deletedAttachment={deletedAttachment}
                                    />
                                ))}
                            </Flex>
                        </Collapsible.Content>
                        <Collapsible.Trigger asChild>
                            <Flex justify="start" mt="2">
                                <Button size="sm" variant="secondary">
                                    {t(`card.${isOpened ? "Show fewer attachments" : "Show all attachments ({attachments} hidden)"}`, {
                                        attachments: attachments.length - 5,
                                    })}
                                </Button>
                            </Flex>
                        </Collapsible.Trigger>
                    </Collapsible.Root>
                )}
            </SortableContext>

            {!TypeUtils.isUndefined(window) &&
                createPortal(
                    <DragOverlay>
                        {activeAttachment && <BoardCardAttachment attachment={activeAttachment} deletedAttachment={deletedAttachment} isOverlay />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default BoardCardAttachmentList;

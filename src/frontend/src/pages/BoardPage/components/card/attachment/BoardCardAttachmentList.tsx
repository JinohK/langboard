import { Button, Collapsible, Flex, Toast } from "@/components/base";
import useChangeCardAttachmentOrder from "@/controllers/api/card/attachment/useChangeCardAttachmentOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { ProjectCardAttachment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardAttachment, { SkeletonBoardCardAttachment } from "@/pages/BoardPage/components/card/attachment/BoardCardAttachment";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardAttachmentList() {
    return (
        <Flex direction="col" gap="2">
            <SkeletonBoardCardAttachment />
            <SkeletonBoardCardAttachment />
            <SkeletonBoardCardAttachment />
        </Flex>
    );
}

function BoardCardAttachmentList(): JSX.Element {
    const [t] = useTranslation();
    const { projectUID, card, socket } = useBoardCard();
    const { mutate: changeCardAttachmentOrderMutate } = useChangeCardAttachmentOrder();
    const flatAttachments = card.useForeignField<ProjectCardAttachment.TModel>("attachments");
    const { columns: attachments, reorder: reorderAttachments } = useReorderColumn({
        type: "ProjectCardAttachment",
        topicId: card.uid,
        columns: flatAttachments,
        socket,
    });
    const attachmentsUIDs = useMemo(() => attachments.map((attachment) => attachment.uid), [attachments]);
    const dndContextId = useId();
    const {
        activeColumn: activeAttachment,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<ProjectCardAttachment.TModel, ProjectCardAttachment.TModel>({
        columnDragDataType: "Attachment",
        rowDragDataType: "FakeAttachment",
        columnCallbacks: {
            onDragEnd: (originalAttachment, index) => {
                const originalAttachmentOrder = originalAttachment.order;
                if (!reorderAttachments(originalAttachment, index)) {
                    return;
                }

                changeCardAttachmentOrderMutate(
                    { project_uid: projectUID, card_uid: card.uid, attachment_uid: originalAttachment.uid, order: index },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    reorderAttachments(originalAttachment, originalAttachmentOrder);
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

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOverOrMove}>
            <SortableContext items={attachmentsUIDs} strategy={verticalListSortingStrategy}>
                <Flex direction="col" gap="2">
                    {attachments.slice(0, 5).map((attachment) => (
                        <BoardCardAttachment key={`board-card-${card.uid}-attachment-${attachment.uid}`} attachment={attachment} />
                    ))}
                </Flex>
                {attachments.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <Flex direction="col" gap="2" mt="2">
                                {attachments.slice(5).map((attachment) => (
                                    <BoardCardAttachment key={`board-card-${card.uid}-attachment-${attachment.uid}`} attachment={attachment} />
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
                    <DragOverlay>{activeAttachment && <BoardCardAttachment attachment={activeAttachment} isOverlay />}</DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default BoardCardAttachmentList;

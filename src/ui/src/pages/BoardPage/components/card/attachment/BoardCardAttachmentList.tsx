import { Button, Collapsible, Flex } from "@/components/base";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import useChangeCardAttachmentOrder from "@/controllers/api/card/attachment/useChangeCardAttachmentOrder";
import { singleDndHelpers } from "@/core/helpers/dnd";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnReordered from "@/core/hooks/useColumnReordered";
import { ProjectCardAttachment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardAttachment, { SkeletonBoardCardAttachment } from "@/pages/BoardPage/components/card/attachment/BoardCardAttachment";
import {
    BOARD_CARD_ATTACHMENT_DND_SETTINGS,
    BOARD_CARD_ATTACHMENT_DND_SYMBOL_SET,
} from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentConstants";
import { Utils } from "@langboard/core/utils";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

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
    const { projectUID, card, socket, viewportRef } = useBoardCard();
    const { mutate: changeCardAttachmentOrderMutate } = useChangeCardAttachmentOrder();
    const updater = useReducer((x) => x + 1, 0);
    const flatAttachments = ProjectCardAttachment.Model.useModels((model) => model.card_uid === card.uid);
    const attachmentsMap = useMemo<Record<string, ProjectCardAttachment.TModel>>(() => {
        const map: Record<string, ProjectCardAttachment.TModel> = {};
        flatAttachments.forEach((attachment) => {
            map[attachment.uid] = attachment;
        });
        return map;
    }, [flatAttachments]);
    const { columns: attachments } = useColumnReordered({
        type: "ProjectCardAttachment",
        topicId: card.uid,
        columns: flatAttachments,
        socket,
        updater,
    });
    const [isOpened, setIsOpened] = useState(false);
    const [isPreviewOpened, setIsPreviewOpened] = useState(false);
    const initialPreviewIndex = useRef(0);

    const openPreview = (index: number) => {
        initialPreviewIndex.current = index;
        setIsPreviewOpened(true);
    };

    useEffect(() => {
        const scrollable = viewportRef.current;
        invariant(scrollable);

        const setupApiErrors = (error: unknown, undo: () => void) => {
            const { handle } = setupApiErrorHandler({
                code: {
                    after: undo,
                },
                wildcard: {
                    after: undo,
                },
            });

            handle(error);
        };

        return singleDndHelpers.root({
            rowsMap: attachmentsMap,
            symbolSet: BOARD_CARD_ATTACHMENT_DND_SYMBOL_SET,
            settings: BOARD_CARD_ATTACHMENT_DND_SETTINGS,
            scrollable,
            changeOrder: ({ rowUID, order, undo }) => {
                changeCardAttachmentOrderMutate(
                    { project_uid: projectUID, card_uid: card.uid, attachment_uid: rowUID, order },
                    {
                        onError: (error) => setupApiErrors(error, undo),
                    }
                );
            },
        });
    }, [flatAttachments, attachmentsMap]);

    return (
        <>
            <Flex direction="col">
                {attachments.slice(0, 5).map((attachment, i) => (
                    <BoardCardAttachment
                        key={`board-card-${card.uid}-attachment-${attachment.uid}`}
                        attachment={attachment}
                        openPreview={() => openPreview(i)}
                    />
                ))}
            </Flex>
            {attachments.length > 5 && (
                <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                    <Collapsible.Content asChild>
                        <Flex direction="col" mt="2">
                            {attachments.slice(5).map((attachment, i) => (
                                <BoardCardAttachment
                                    key={`board-card-${card.uid}-attachment-${attachment.uid}`}
                                    attachment={attachment}
                                    openPreview={() => openPreview(i)}
                                />
                            ))}
                        </Flex>
                    </Collapsible.Content>
                    <Flex justify="start" mt="2">
                        <Collapsible.Trigger asChild>
                            <Button size="sm" variant="secondary">
                                {t(`card.${isOpened ? "Show fewer attachments" : "Show all attachments ({attachments} hidden)"}`, {
                                    attachments: attachments.length - 5,
                                })}
                            </Button>
                        </Collapsible.Trigger>
                    </Flex>
                </Collapsible.Root>
            )}

            {!Utils.Type.isUndefined(window) &&
                isPreviewOpened &&
                createPortal(
                    <ImagePreviewDialog
                        files={attachments.map((attachment) => ({ name: attachment.name, url: attachment.url }))}
                        initialIndex={initialPreviewIndex.current}
                        onClose={() => setIsPreviewOpened(false)}
                    />,
                    document.body
                )}
        </>
    );
}

export default BoardCardAttachmentList;

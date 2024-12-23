import { Flex } from "@/components/base";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardActionAttachedFile from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachedFile";
import { IAttachedFile } from "@/pages/BoardPage/components/card/action/types";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { memo, useId, useMemo } from "react";
import { createPortal } from "react-dom";

export interface IBoardCardActionAttachedFileListProps {
    attachedFiles: IAttachedFile[];
    deleteFile: (key: string) => void;
    update: () => void;
}

const BoardCardActionAttachedFileList = memo(({ attachedFiles, deleteFile, update }: IBoardCardActionAttachedFileListProps) => {
    const attachedFileKeys = useMemo(() => attachedFiles.map((attachedFile) => attachedFile.key), [attachedFiles]);
    const dndContextId = useId();
    const {
        activeColumn: activeAttachedFile,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<IAttachedFile, IAttachedFile>({
        columnDragDataType: "AttachedFile",
        rowDragDataType: "FakeAttachedFile",
        columnCallbacks: {
            onDragEnd: (originalAttachedFile, index) => {
                arrayMove(attachedFiles, originalAttachedFile.order, index).map((attachedFile, i) => {
                    attachedFile.order = i;
                });

                update();
            },
        },
        transformContainerId: () => "",
    });

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOverOrMove}>
            <SortableContext items={attachedFileKeys} strategy={verticalListSortingStrategy}>
                <Flex direction="col" gap="2">
                    {attachedFiles.map((attachedFile) => (
                        <BoardCardActionAttachedFile key={`attached-file-${attachedFile.key}`} attachedFile={attachedFile} deleteFile={deleteFile} />
                    ))}
                </Flex>
            </SortableContext>

            {!TypeUtils.isUndefined(window) &&
                createPortal(
                    <DragOverlay>
                        {activeAttachedFile && <BoardCardActionAttachedFile attachedFile={activeAttachedFile} deleteFile={deleteFile} isOverlay />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
});

export default BoardCardActionAttachedFileList;

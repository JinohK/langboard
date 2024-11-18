import { Flex } from "@/components/base";
import { IBoardCardFile } from "@/controllers/board/useGetCardDetails";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import BoardCardFile from "@/pages/BoardPage/components/card/BoardCardFile";
import { IBaseCardRelatedComponentProps } from "@/pages/BoardPage/components/card/types";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export interface IBoardCardFileListProps extends IBaseCardRelatedComponentProps {
    files: IBoardCardFile[];
}

function BoardCardFileList({
    projectUID,
    card,
    currentUser,
    currentUserRoleActions,
    socket,
    files: flatFiles,
}: IBoardCardFileListProps): JSX.Element {
    const [files, setFiles] = useState<IBoardCardFile[]>(flatFiles);
    const filesUIDs = useMemo(() => files.map((file) => file.uid), [files]);
    const dndContextId = useId();
    const {
        activeColumn: activeFile,
        containerIdRowDragCallbacksRef: callbacksRef,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOver,
    } = useColumnRowSortable<IBoardCardFile, IBoardCardFile>({
        columnDragDataType: "File",
        rowDragDataType: "_",
        columnCallbacks: {
            onDragEnd: (originalFile, index) => {
                setFiles((prev) => arrayMove(prev, originalFile.order, index).map((file, i) => ({ ...file, order: i })));
            },
        },
        transformContainerId: () => "",
    });
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <SortableContext items={filesUIDs} strategy={verticalListSortingStrategy}>
                <Flex direction="col" gap="2">
                    {files.map((file) => (
                        <BoardCardFile
                            file={file}
                            key={`board-card-${card.uid}-file-${file.uid}`}
                            orderable={hasRoleAction(Project.ERoleAction.CARD_UPDATE)}
                        />
                    ))}
                </Flex>
            </SortableContext>

            {typeof window !== "undefined" &&
                createPortal(<DragOverlay>{activeFile && <BoardCardFile file={activeFile} isOverlay orderable />}</DragOverlay>, document.body)}
        </DndContext>
    );
}

export default BoardCardFileList;

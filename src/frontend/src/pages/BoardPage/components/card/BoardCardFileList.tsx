import { Button, Collapsible, Flex } from "@/components/base";
import { IBoardCardFile } from "@/controllers/board/useGetCardDetails";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardFile from "@/pages/BoardPage/components/card/BoardCardFile";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

function BoardCardFileList(): JSX.Element {
    const [t] = useTranslation();
    const { card, currentUserRoleActions } = useBoardCard();
    const [files, setFiles] = useState<IBoardCardFile[]>(card.files);
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
    const [isOpened, setIsOpened] = useState(false);

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <SortableContext items={filesUIDs} strategy={verticalListSortingStrategy}>
                <Flex direction="col" gap="2">
                    {files.slice(0, 5).map((file) => (
                        <BoardCardFile
                            file={file}
                            key={`board-card-${card.uid}-file-${file.uid}`}
                            orderable={hasRoleAction(Project.ERoleAction.CARD_UPDATE)}
                        />
                    ))}
                </Flex>
                {files.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <Flex direction="col" gap="2" mt="2">
                                {files.slice(5).map((file) => (
                                    <BoardCardFile
                                        file={file}
                                        key={`board-card-${card.uid}-file-${file.uid}`}
                                        orderable={hasRoleAction(Project.ERoleAction.CARD_UPDATE)}
                                    />
                                ))}
                            </Flex>
                        </Collapsible.Content>
                        <Collapsible.Trigger asChild>
                            <Flex justify="start" mt="2">
                                <Button size="sm" variant="secondary">
                                    {t(`card.${isOpened ? "Show fewer attachments" : "Show all attachments ({files} hidden)"}`, {
                                        files: files.length - 5,
                                    })}
                                </Button>
                            </Flex>
                        </Collapsible.Trigger>
                    </Collapsible.Root>
                )}
            </SortableContext>

            {typeof window !== "undefined" &&
                createPortal(<DragOverlay>{activeFile && <BoardCardFile file={activeFile} isOverlay orderable />}</DragOverlay>, document.body)}
        </DndContext>
    );
}

export default BoardCardFileList;

import { Flex, Toast } from "@/components/base";
import useChangeProjectLabelOrder from "@/controllers/api/board/settings/useChangeProjectLabelOrder";
import useProjectLabelCreatedHandlers from "@/controllers/socket/project/label/useProjectLabelCreatedHandlers";
import useProjectLabelDeletedHandlers from "@/controllers/socket/project/label/useProjectLabelDeletedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { ProjectLabel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardSettingsLabel from "@/pages/BoardPage/components/settings/label/BoardSettingsLabel";
import BoardSettingsLabelAddButton from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelAddButton";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { memo, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const BoardSettingsLabelList = memo(() => {
    const { project, socket } = useBoardSettings();
    const [t] = useTranslation();
    const { mutate: changeProjectLabelOrderMutate } = useChangeProjectLabelOrder();
    const {
        columns: labels,
        setColumns: setLabels,
        reorder: reorderLabels,
    } = useReorderColumn({
        type: "ProjectLabel",
        topicId: project.uid,
        eventNameParams: { uid: project.uid },
        columns: project.labels,
        socket,
    });
    const labelUIDs = useMemo(() => labels.map((label) => label.uid), [labels]);
    const dndContextId = useId();
    const deletedLabel = (uid: string) => {
        setLabels((prev) => {
            const newLabels = prev.filter((label) => label.uid !== uid);
            project.labels = newLabels;
            return newLabels;
        });
    };
    const projectLabelCreatedHandler = useProjectLabelCreatedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            setLabels((prev) => {
                const newLabels = [...prev];
                if (!prev.some((label) => label.uid === data.label.uid)) {
                    newLabels.push(data.label);
                }

                project.labels = newLabels;
                return newLabels.sort((a, b) => a.order - b.order).map((label, i) => ({ ...label, order: i }));
            });
        },
    });
    const projectLabelDeletedHandler = useProjectLabelDeletedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            deletedLabel(data.uid);
        },
    });
    useSwitchSocketHandlers({ socket, handlers: [projectLabelCreatedHandler, projectLabelDeletedHandler] });
    const {
        activeColumn: activeLabel,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<ProjectLabel.Interface, ProjectLabel.Interface>({
        columnDragDataType: "Label",
        rowDragDataType: "FakeLabel",
        columnCallbacks: {
            onDragEnd: (originalLabel, index) => {
                if (!reorderLabels(originalLabel, index)) {
                    return;
                }

                changeProjectLabelOrderMutate(
                    { project_uid: project.uid, label_uid: originalLabel.uid, order: index },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    setLabels((prev) => arrayMove(prev, originalLabel.order, index).map((label, i) => ({ ...label, order: i })));
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

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOverOrMove}>
            <SortableContext items={labelUIDs} strategy={verticalListSortingStrategy}>
                <Flex direction="col" gap="2" py="4">
                    {labels.map((label) => (
                        <BoardSettingsLabel key={`board-setting-label-${label.uid}`} label={label} deletedLabel={deletedLabel} />
                    ))}
                </Flex>
            </SortableContext>
            <BoardSettingsLabelAddButton />

            {!TypeUtils.isUndefined(window) &&
                createPortal(
                    <DragOverlay>{activeLabel && <BoardSettingsLabel label={activeLabel} deletedLabel={deletedLabel} isOverlay />}</DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
});

export default BoardSettingsLabelList;

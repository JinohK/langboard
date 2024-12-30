import { Flex, Toast } from "@/components/base";
import useChangeProjectLabelOrder from "@/controllers/api/board/settings/useChangeProjectLabelOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { ProjectLabel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardSettingsLabel from "@/pages/BoardPage/components/settings/label/BoardSettingsLabel";
import BoardSettingsLabelAddButton from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelAddButton";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { memo, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const BoardSettingsLabelList = memo(() => {
    const { project, socket } = useBoardSettings();
    const [t] = useTranslation();
    const { mutate: changeProjectLabelOrderMutate } = useChangeProjectLabelOrder();
    const flatLabels = project.useForeignField<ProjectLabel.TModel>("labels");
    const { columns: labels, reorder: reorderLabels } = useReorderColumn({
        type: "ProjectLabel",
        topicId: project.uid,
        eventNameParams: { uid: project.uid },
        columns: flatLabels,
        socket,
    });
    const labelUIDs = useMemo(() => labels.map((label) => label.uid), [labels]);
    const dndContextId = useId();
    const {
        activeColumn: activeLabel,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<ProjectLabel.TModel, ProjectLabel.TModel>({
        columnDragDataType: "Label",
        rowDragDataType: "FakeLabel",
        columnCallbacks: {
            onDragEnd: (originalLabel, index) => {
                const originalLabelOrder = originalLabel.order;
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
                                    reorderLabels(originalLabel, originalLabelOrder);
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
                        <BoardSettingsLabel key={`board-setting-label-${label.uid}`} label={label} />
                    ))}
                </Flex>
            </SortableContext>
            <BoardSettingsLabelAddButton />

            {!TypeUtils.isUndefined(window) &&
                createPortal(<DragOverlay>{activeLabel && <BoardSettingsLabel label={activeLabel} isOverlay />}</DragOverlay>, document.body)}
        </DndContext>
    );
});

export default BoardSettingsLabelList;

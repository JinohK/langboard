import { Box, Button, Collapsible, Flex, Toast } from "@/components/base";
import useChangeCardCheckGroupOrder from "@/controllers/api/card/checkgroup/useChangeCardCheckGroupOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { ProjectCheckGroup, ProjectCheckitem } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import BoardCardCheckGroup from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroup";
import BoardCardCheckitem from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckitem";
import SkeletonBoardCardCheckitem from "@/pages/BoardPage/components/card/checkgroup/SkeletonBoardCardCheckitem";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export function SkeletonBoardCardCheckGroupList() {
    return (
        <>
            <SkeletonBoardCardCheckitem />
            <SkeletonBoardCardCheckitem />
            <SkeletonBoardCardCheckitem />
        </>
    );
}

function BoardCardCheckGroupList(): JSX.Element {
    const [t] = useTranslation();
    const { card, socket } = useBoardCard();
    const [isOpened, setIsOpened] = useState(false);
    const flatCheckGroups = card.useForeignField<ProjectCheckGroup.TModel>("check_groups");
    const { mutate: changeOrderMutate } = useChangeCardCheckGroupOrder();
    const { columns: checkGroups, reorder: reorderCheckitems } = useReorderColumn({
        type: "ProjectCheckGroup",
        eventNameParams: { uid: card.uid },
        topicId: card.uid,
        columns: flatCheckGroups,
        socket,
    });
    const checkGroupUIDs = useMemo(() => checkGroups.map((checkGroup) => checkGroup.uid), [checkGroups]);
    const checkitemsMap = useMemo<Record<string, ProjectCheckitem.TModel>>(() => {
        const map: Record<string, ProjectCheckitem.TModel> = {};
        checkGroups.forEach((checkGroup) => {
            checkGroup.checkitems.forEach((checkitem) => {
                map[checkitem.uid] = checkitem;
            });
        });
        return map;
    }, [checkGroups]);
    const dndContextId = useId();
    const {
        activeColumn: activeCheckGroup,
        activeRow: activeCheckitem,
        containerIdRowDragCallbacksRef: callbacksRef,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<ProjectCheckGroup.TModel, ProjectCheckitem.TModel>({
        columnDragDataType: "CheckGroup",
        rowDragDataType: "Checkitem",
        columnCallbacks: {
            onDragEnd: (originalCheckGroup, index) => {
                const originalCheckitemOrder = originalCheckGroup.order;
                if (!reorderCheckitems(originalCheckGroup, index)) {
                    return;
                }

                changeOrderMutate(
                    {
                        project_uid: card.project_uid,
                        card_uid: card.uid,
                        check_group_uid: originalCheckGroup.uid,
                        order: index,
                    },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    reorderCheckitems(originalCheckGroup, originalCheckitemOrder);
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
        },
        transformContainerId: (item) => {
            return `board-check-group-${(item as ProjectCheckitem.TModel).check_group_uid ?? item.uid}`;
        },
    });

    return (
        <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOverOrMove}>
            <SortableContext items={checkGroupUIDs} strategy={verticalListSortingStrategy}>
                {checkGroups.slice(0, 5).map((checkGroup) => (
                    <BoardCardCheckGroup
                        key={`board-check-group-${checkGroup.uid}`}
                        checkGroup={checkGroup}
                        checkitemsMap={checkitemsMap}
                        callbacksRef={callbacksRef}
                    />
                ))}
                {checkGroups.length > 5 && (
                    <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
                        <Collapsible.Content asChild>
                            <Box>
                                {checkGroups.slice(5).map((checkGroup) => (
                                    <BoardCardCheckGroup
                                        key={`board-check-group-${checkGroup.uid}`}
                                        checkGroup={checkGroup}
                                        checkitemsMap={checkitemsMap}
                                        callbacksRef={callbacksRef}
                                    />
                                ))}
                            </Box>
                        </Collapsible.Content>
                        <Collapsible.Trigger asChild>
                            <Flex justify="start" mt="2">
                                <Button size="sm" variant="secondary">
                                    {t(`card.${isOpened ? "Show fewer check groups" : "Show all check groups ({checkGroups} hidden)"}`, {
                                        checkGroups: checkGroups.length - 5,
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
                        {activeCheckGroup && (
                            <BoardCardCheckGroup
                                key={`board-check-group-${activeCheckGroup.uid}`}
                                checkGroup={activeCheckGroup}
                                checkitemsMap={checkitemsMap}
                                callbacksRef={callbacksRef}
                                isOverlay
                            />
                        )}
                        {activeCheckitem && <BoardCardCheckitem checkitem={activeCheckitem} isOverlay />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );
}

export default BoardCardCheckGroupList;

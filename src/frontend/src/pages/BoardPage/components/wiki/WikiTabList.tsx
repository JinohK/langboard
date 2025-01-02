import { Flex, Toast } from "@/components/base";
import useChangeWikiOrder from "@/controllers/api/wiki/useChangeWikiOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { TMoreWikiTabDropzonCallbacks } from "@/pages/BoardPage/components/wiki/types";
import WikiBin from "@/pages/BoardPage/components/wiki/WikiBin";
import WikiTab, { SkeletonWikiTab } from "@/pages/BoardPage/components/wiki/WikiTab";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { memo, useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export interface IWikiTabListProps {
    changeTab: (uid: string) => void;
}

export function SkeletonWikiTabList() {
    return (
        <Flex justify="center" items="center" gap="1" inline h="10" p="1">
            <SkeletonWikiTab />
            <SkeletonWikiTab />
            <SkeletonWikiTab />
        </Flex>
    );
}

const WikiTabList = memo(({ changeTab }: IWikiTabListProps) => {
    const { projectUID, wikis: flatWikis, socket, disabledReorder } = useBoardWiki();
    const [t] = useTranslation();
    const { mutate: changeWikiOrderMutate } = useChangeWikiOrder();
    const moreDroppableZoneCallbacksRef = useRef<TMoreWikiTabDropzonCallbacks>({});
    const {
        columns: wikis,
        setColumns: setWikis,
        reorder: reorderWikis,
    } = useReorderColumn<ProjectWiki.TModel>({
        type: "ProjectWiki",
        eventNameParams: { uid: projectUID },
        topicId: projectUID,
        columns: flatWikis,
        socket,
    });
    const wikisUIDs = useMemo(() => wikis.map((wiki) => wiki.uid), [wikis]);
    const dndContextId = useId();
    const {
        activeColumn: activeWiki,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
        onDragCancel,
    } = useColumnRowSortable<ProjectWiki.TModel, ProjectWiki.TModel>({
        columnDragDataType: "Wiki",
        rowDragDataType: "FakeWiki",
        columnCallbacks: {
            onDragEnd: (orignalWiki, index) => {
                const originalWikiOrder = orignalWiki.order;
                const targetWiki = wikis.find((wiki) => wiki.uid === orignalWiki.uid);
                if (targetWiki) {
                    targetWiki.isInBin = false;
                }

                if (!reorderWikis(orignalWiki, index)) {
                    return;
                }

                changeWikiOrderMutate(
                    { project_uid: projectUID, wiki_uid: orignalWiki.uid, order: index },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    reorderWikis(orignalWiki, originalWikiOrder);
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
            onDragOverOrMove: (activeWiki) => {
                const targetWiki = wikis.find((wiki) => wiki.uid === activeWiki.uid);
                if (!targetWiki || !targetWiki.isInBin) {
                    return;
                }

                targetWiki.isInBin = false;
                setWikis((prev) => [...prev]);
            },
            onDragCancel: (originalWiki) => {
                const targetWiki = wikis.find((wiki) => wiki.uid === originalWiki.uid);
                if (!targetWiki) {
                    return;
                }

                targetWiki.isInBin = false;
                setWikis((prev) => [...prev]);
            },
        },
        transformContainerId: () => "",
        moreDroppableZoneCallbacks: moreDroppableZoneCallbacksRef.current,
    });

    useEffect(() => {
        setWikis(flatWikis);
    }, [flatWikis]);

    return (
        <DndContext
            id={dndContextId}
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOverOrMove}
            onDragCancel={onDragCancel}
        >
            <SortableContext items={wikisUIDs} strategy={horizontalListSortingStrategy} disabled={disabledReorder}>
                {wikis.map((wiki) => (
                    <WikiTab key={`board-wiki-${wiki.uid}-tab`} changeTab={changeTab} wiki={wiki} />
                ))}
            </SortableContext>

            {!TypeUtils.isUndefined(window) &&
                createPortal(<DragOverlay>{activeWiki && <WikiTab changeTab={changeTab} wiki={activeWiki} isOverlay />}</DragOverlay>, document.body)}
            {activeWiki && createPortal(<WikiBin moreDroppableZoneCallbacksRef={moreDroppableZoneCallbacksRef} />, document.body)}
        </DndContext>
    );
});

export default WikiTabList;

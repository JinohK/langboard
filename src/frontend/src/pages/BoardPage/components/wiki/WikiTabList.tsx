import { Flex, Toast } from "@/components/base";
import useChangeWikiOrder from "@/controllers/api/wiki/useChangeWikiOrder";
import useBoardWikiCreatedHandlers from "@/controllers/socket/wiki/useBoardWikiCreatedHandlers";
import useBoardWikiDeletedHandlers from "@/controllers/socket/wiki/useBoardWikiDeletedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { IDraggableProjectWiki, TMoreWikiTabDropzonCallbacks } from "@/pages/BoardPage/components/wiki/types";
import WikiBin from "@/pages/BoardPage/components/wiki/WikiBin";
import WikiTab, { SkeletonWikiTab } from "@/pages/BoardPage/components/wiki/WikiTab";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { memo, useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export interface IWikiTabListProps {
    wikiUID: string;
    changeTab: (uid: string) => void;
}

export function SkeletonWikiTabList() {
    return (
        <Flex justify="center" items="center" gap="1" inline h="10" p="1">
            <SkeletonWikiTab />
            <SkeletonWikiTab />
            <SkeletonWikiTab />
            <SkeletonWikiTab />
        </Flex>
    );
}

const WikiTabList = memo(({ wikiUID, changeTab }: IWikiTabListProps) => {
    const { projectUID, wikis: flatWikis, setWikis: setFlatWikis, socket, currentUser } = useBoardWiki();
    const [t] = useTranslation();
    const { mutate: changeWikiOrderMutate } = useChangeWikiOrder();
    const moreDroppableZoneCallbacksRef = useRef<TMoreWikiTabDropzonCallbacks>({});
    const {
        columns: wikis,
        setColumns: setWikis,
        reorder: reorderColumns,
    } = useReorderColumn<IDraggableProjectWiki>({
        type: "BoardWiki",
        eventNameParams: { uid: projectUID },
        topicId: projectUID,
        columns: flatWikis,
        socket,
    });
    const wikisUIDs = useMemo(() => wikis.map((wiki) => wiki.uid), [wikis]);
    const dndContextId = useId();
    const { on: onBoardWikiCreated } = useBoardWikiCreatedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            setFlatWikis((prev) => {
                const newWikis = [...prev];
                if (!prev.some((wiki) => wiki.uid === data.wiki.uid)) {
                    newWikis.push(data.wiki);
                }

                return newWikis.sort((a, b) => a.order - b.order).map((wiki, i) => ({ ...wiki, order: i }));
            });
        },
    });
    const { on: onBoardPrivateWikiCreated } = useBoardWikiCreatedHandlers({
        socket,
        projectUID,
        username: currentUser.username,
        callback: (data) => {
            setFlatWikis((prev) => {
                const newWikis = [...prev];
                if (!prev.some((wiki) => wiki.uid === data.wiki.uid)) {
                    newWikis.push(data.wiki);
                }

                return newWikis.sort((a, b) => a.order - b.order).map((wiki, i) => ({ ...wiki, order: i }));
            });
        },
    });
    const { on: onBoardWikiDeletedHandlers } = useBoardWikiDeletedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            setFlatWikis((prev) => prev.filter((wiki) => wiki.uid !== data.uid));
            if (wikiUID === data.uid) {
                Toast.Add.info(t("wiki.Wiki page deleted."));
                changeTab("");
            }
        },
    });
    const {
        activeColumn: activeWiki,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
        onDragCancel,
    } = useColumnRowSortable<IDraggableProjectWiki, IDraggableProjectWiki>({
        columnDragDataType: "Wiki",
        rowDragDataType: "FakeWiki",
        columnCallbacks: {
            onDragEnd: (orignalWiki, index) => {
                const targetWiki = wikis.find((wiki) => wiki.uid === orignalWiki.uid);
                if (targetWiki) {
                    delete targetWiki.isInBin;
                }

                if (!reorderColumns(orignalWiki, index)) {
                    return;
                }

                changeWikiOrderMutate(
                    { project_uid: projectUID, wiki_uid: orignalWiki.uid, order: index },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    setWikis((prev) => arrayMove(prev, orignalWiki.order, index).map((wiki, i) => ({ ...wiki, order: i })));
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
            onDragOverOrMove: (activeWiki) => {
                if (!activeWiki.isInBin) {
                    return;
                }

                const targetWiki = wikis.find((wiki) => wiki.uid === activeWiki.uid);
                if (!targetWiki) {
                    return;
                }

                delete targetWiki.isInBin;
                setWikis((prev) => [...prev]);
            },
            onDragCancel: (originalWiki) => {
                const targetWiki = wikis.find((wiki) => wiki.uid === originalWiki.uid);
                if (!targetWiki) {
                    return;
                }

                delete targetWiki.isInBin;
                setWikis((prev) => [...prev]);
            },
        },
        transformContainerId: () => "",
        moreDroppableZoneCallbacks: moreDroppableZoneCallbacksRef.current,
    });

    useEffect(() => {
        const { off: offBoardWikiCreated } = onBoardWikiCreated();
        const { off: offBoardPrivateWikiCreated } = onBoardPrivateWikiCreated();
        const { off: offBoardWikiDeletedHandlers } = onBoardWikiDeletedHandlers();

        return () => {
            offBoardWikiCreated();
            offBoardPrivateWikiCreated();
            offBoardWikiDeletedHandlers();
        };
    }, []);

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
            <SortableContext items={wikisUIDs} strategy={horizontalListSortingStrategy}>
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

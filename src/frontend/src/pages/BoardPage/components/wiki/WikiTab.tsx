import { Box, Button, IconComponent, Skeleton, Tabs, Toast, Tooltip } from "@/components/base";
import useDeleteWiki from "@/controllers/api/wiki/useDeleteWiki";
import { singleDndHelpers } from "@/core/helpers/dnd";
import { SINGLE_ROW_IDLE } from "@/core/helpers/dnd/createDndSingleRowEvents";
import { TSingleRowState } from "@/core/helpers/dnd/types";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useGrabbingScrollHorizontal from "@/core/hooks/useGrabbingScrollHorizontal";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { BOARD_WIKI_DND_SYMBOL_SET } from "@/pages/BoardPage/components/wiki/WikiConstants";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

export interface IWikiTabProps {
    changeTab: (uid: string) => void;
    wiki: ProjectWiki.TModel;
}

export function SkeletonWikiTab() {
    return <Skeleton h="8" w={{ initial: "14", sm: "20", md: "28" }} />;
}

function WikiTab({ changeTab, wiki }: IWikiTabProps) {
    const [state, setState] = useState<TSingleRowState>(SINGLE_ROW_IDLE);
    const order = wiki.useField("order");
    const forbidden = wiki.useField("forbidden");
    const outerRef = useRef<HTMLDivElement | null>(null);
    const draggableRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (forbidden) {
            return;
        }

        const outer = outerRef.current;
        const draggable = draggableRef.current;
        invariant(outer && draggable);

        return singleDndHelpers.row({
            row: wiki,
            symbolSet: BOARD_WIKI_DND_SYMBOL_SET,
            draggable: draggable,
            dropTarget: outer,
            isHorizontal: true,
            setState,
            renderPreview({ container }) {
                // Simple drag preview generation: just cloning the current element.
                // Not using react for this.
                const rect = outer.getBoundingClientRect();
                const preview = outer.cloneNode(true);
                invariant(TypeUtils.isElement(preview, "div"));
                preview.style.width = `${rect.width}px`;
                preview.style.height = `${rect.height}px`;

                container.appendChild(preview);
            },
        });
    }, [wiki, order, forbidden]);

    return (
        <Box position="relative" ref={outerRef}>
            {state.type === "is-over" && <DropIndicator edge={state.closestEdge} gap="4px" />}
            <WikiTabDisplay changeTab={changeTab} wiki={wiki} draggableRef={draggableRef} />
        </Box>
    );
}

interface IWikiTabDisplayProps {
    changeTab: (uid: string) => void;
    wiki: ProjectWiki.TModel;
    draggableRef?: React.RefObject<HTMLButtonElement | null>;
}

const WikiTabDisplay = memo(({ changeTab, wiki, draggableRef }: IWikiTabDisplayProps) => {
    const [t] = useTranslation();
    const { projectUID, modeType, wikiTabListId } = useBoardWiki();
    const forbidden = wiki.useField("forbidden");
    const title = wiki.useField("title");
    const { onPointerDown } = useGrabbingScrollHorizontal(wikiTabListId);
    const { mutateAsync: deleteWikiMutateAsync } = useDeleteWiki();

    const scrollHorizontal = (event: React.PointerEvent<HTMLElement>) => {
        if (modeType !== "view") {
            return;
        }

        onPointerDown(event);
    };

    const handleTriggerClick = useCallback(() => {
        if (forbidden) {
            return;
        }

        changeTab(wiki.uid);
    }, [changeTab, forbidden]);

    const deleteWiki = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const promise = deleteWikiMutateAsync({
            project_uid: projectUID,
            wiki_uid: wiki.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("wiki.successes.Wiki page deleted successfully.");
            },
            finally: () => {},
        });
    };

    return (
        <Tooltip.Root>
            <Tabs.Trigger
                value={wiki.uid}
                id={`board-wiki-${wiki.uid}-tab`}
                disabled={forbidden}
                onPointerDown={scrollHorizontal}
                className={cn("cursor-pointer ring-primary", modeType === "delete" && "pr-1")}
                onClick={handleTriggerClick}
            >
                <Tooltip.Trigger asChild>
                    <span className="max-w-40 truncate" onPointerDown={scrollHorizontal} ref={draggableRef}>
                        {forbidden ? t("wiki.Private") : title}
                    </span>
                </Tooltip.Trigger>
                {modeType === "delete" && (
                    <Button asChild variant="destructiveGhost" size="icon-sm" title={t("common.Delete")} className="ml-2 size-6" onClick={deleteWiki}>
                        <span>
                            <IconComponent icon="trash-2" size="3" />
                        </span>
                    </Button>
                )}
            </Tabs.Trigger>
            <Tooltip.Content>{forbidden ? t("wiki.Private") : title}</Tooltip.Content>
        </Tooltip.Root>
    );
});

export default WikiTab;

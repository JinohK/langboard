import { Box, Skeleton, Tabs, Tooltip } from "@/components/base";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import useGrabbingScrollHorizontal from "@/core/hooks/useGrabbingScrollHorizontal";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IWikiTabProps {
    changeTab: (uid: string) => void;
    wiki: ProjectWiki.TModel;
    isOverlay?: bool;
}

interface IBoardWikiDragData extends ISortableDragData<ProjectWiki.TModel> {
    type: "Wiki";
}

export function SkeletonWikiTab() {
    return <Skeleton h="8" w={{ initial: "14", sm: "20", md: "28" }} />;
}

const WikiTab = memo(({ changeTab, wiki, isOverlay }: IWikiTabProps) => {
    const [t] = useTranslation();
    const isInBin = wiki.useField("isInBin");
    const { disabledReorder, wikiTabListId } = useBoardWiki();
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: wiki.uid,
        data: {
            type: "Wiki",
            data: wiki,
        } satisfies IBoardWikiDragData,
        attributes: {
            roleDescription: "Wiki",
        },
    });
    const forbidden = wiki.useField("forbidden");
    const { onPointerDown } = useGrabbingScrollHorizontal(wikiTabListId);
    const title = wiki.useField("title");

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "cursor-pointer ring-primary",
        variants: {
            dragging: {
                over: "ring-2 opacity-30",
                overlay: "ring-2",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    if (!forbidden) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            onClick: () => {
                if (isDragging) {
                    return;
                }

                changeTab(wiki.uid);
            },
            ...attributes,
            ...listeners,
            ref: setNodeRef,
        };
    } else {
        props = {
            className: variants(),
        };
    }

    if (isOverlay) {
        return (
            <Tabs.Trigger value={wiki.uid} key={`board-wiki-${wiki.uid}-tab`} disabled={forbidden} {...props}>
                <span className="max-w-40 truncate">{forbidden ? t("wiki.Private") : title}</span>
            </Tabs.Trigger>
        );
    }

    const scrollHorizontal = (event: React.PointerEvent<HTMLElement>) => {
        if (!disabledReorder) {
            return;
        }

        onPointerDown(event);
    };

    return (
        <Box hidden={isInBin}>
            <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION}>
                <Tooltip.Root>
                    <Tabs.Trigger
                        value={wiki.uid}
                        key={`board-wiki-${wiki.uid}-tab`}
                        disabled={forbidden}
                        onPointerDown={scrollHorizontal}
                        {...props}
                    >
                        <Tooltip.Trigger asChild>
                            <span className="max-w-40 truncate" onPointerDown={scrollHorizontal}>
                                {forbidden ? t("wiki.Private") : title}
                            </span>
                        </Tooltip.Trigger>
                    </Tabs.Trigger>
                    <Tooltip.Content>{forbidden ? t("wiki.Private") : title}</Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        </Box>
    );
});

export default WikiTab;

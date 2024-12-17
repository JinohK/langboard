import { Skeleton, Tabs, Tooltip } from "@/components/base";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { IDraggableProjectWiki } from "@/pages/BoardPage/components/wiki/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IWikiTabProps {
    changeTab: (uid: string) => void;
    wiki: IDraggableProjectWiki;
    isOverlay?: bool;
}

interface IBoardWikiDragData {
    type: "Wiki";
    data: IDraggableProjectWiki;
}

export function SkeletonWikiTab() {
    return <Skeleton className="h-8 w-20" />;
}

const WikiTab = memo(({ changeTab, wiki, isOverlay }: IWikiTabProps) => {
    const [t] = useTranslation();
    const { canAccessWiki, setTitleMapRef } = useBoardWiki();
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
    const canReorder = canAccessWiki(false, wiki.uid);
    const [title, setTitle] = useState(wiki.title);
    setTitleMapRef.current[wiki.uid] = setTitle;

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
    if (canReorder) {
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
            <Tabs.Trigger value={wiki.uid} key={`board-wiki-${wiki.uid}-tab`} disabled={!canReorder} {...props}>
                <span className="max-w-40 truncate">{wiki.forbidden ? t("wiki.Private") : title}</span>
            </Tabs.Trigger>
        );
    }

    return (
        <div hidden={wiki.isInBin}>
            <Tooltip.Provider delayDuration={400}>
                <Tooltip.Root>
                    <Tabs.Trigger value={wiki.uid} key={`board-wiki-${wiki.uid}-tab`} disabled={!canReorder} {...props}>
                        <Tooltip.Trigger asChild>
                            <span className="max-w-40 truncate">{wiki.forbidden ? t("wiki.Private") : title}</span>
                        </Tooltip.Trigger>
                    </Tabs.Trigger>
                    <Tooltip.Content>{wiki.forbidden ? t("wiki.Private") : title}</Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        </div>
    );
});

export default WikiTab;

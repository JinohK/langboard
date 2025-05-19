import { Box, Button, IconComponent, Skeleton, Tabs, Toast, Tooltip } from "@/components/base";
import useDeleteWiki from "@/controllers/api/wiki/useDeleteWiki";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import useGrabbingScrollHorizontal from "@/core/hooks/useGrabbingScrollHorizontal";
import { ProjectWiki } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useCallback } from "react";
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
    const { projectUID, modeType, wikiTabListId, setWikis } = useBoardWiki();
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
    const { mutateAsync: deleteWikiMutateAsync } = useDeleteWiki();
    const title = wiki.useField("title");

    const deleteWiki = useCallback(
        (e: React.MouseEvent) => {
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
                    const { handle } = setupApiErrorHandler(
                        {
                            [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("wiki.errors.Can't access this wiki."),
                        },
                        messageRef
                    );

                    handle(error);
                    return messageRef.message;
                },
                success: () => {
                    setWikis((prev) => prev.filter((wikiItem) => wikiItem.uid !== wiki.uid));
                    return t("wiki.successes.Wiki page deleted successfully.");
                },
                finally: () => {},
            });
        },
        [setWikis]
    );

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: cn("cursor-pointer ring-primary", modeType === "delete" && "pr-1"),
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
        if (modeType !== "view") {
            return;
        }

        onPointerDown(event);
    };

    return (
        <Box hidden={isInBin}>
            <Tooltip.Root>
                <Tabs.Trigger value={wiki.uid} key={`board-wiki-${wiki.uid}-tab`} disabled={forbidden} onPointerDown={scrollHorizontal} {...props}>
                    <Tooltip.Trigger asChild>
                        <span className="max-w-40 truncate" onPointerDown={scrollHorizontal}>
                            {forbidden ? t("wiki.Private") : title}
                        </span>
                    </Tooltip.Trigger>
                    {modeType === "delete" && (
                        <Button
                            asChild
                            variant="destructiveGhost"
                            size="icon-sm"
                            title={t("common.Delete")}
                            className="ml-2 size-6"
                            onClick={deleteWiki}
                        >
                            <span>
                                <IconComponent icon="trash-2" size="3" />
                            </span>
                        </Button>
                    )}
                </Tabs.Trigger>
                <Tooltip.Content>{forbidden ? t("wiki.Private") : title}</Tooltip.Content>
            </Tooltip.Root>
        </Box>
    );
});

export default WikiTab;

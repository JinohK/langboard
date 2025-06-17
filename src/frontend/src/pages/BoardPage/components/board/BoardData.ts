import { ProjectCardRelationship } from "@/core/models";
import { ProjectCard, ProjectColumn } from "@/core/models";

export interface IBoardColumnCardContextParams {
    setFilters: (relationshipType: ProjectCardRelationship.TRelationship) => void;
}

export const BOARD_SETTINGS = {
    isBoardMoreObvious: false,
    isOverElementAutoScrollEnabled: true,
    boardScrollSpeed: "fast" as const,
    columnScrollSpeed: "standard" as const,
    isFPSPanelEnabled: false,
    isCPUBurnEnabled: false,
    isOverflowScrollingEnabled: true,
};

export const BLOCK_BOARD_PANNING_ATTR = "data-block-board-panning" as const;
export const HOVER_CARD_UID_ATTR = "data-hover-card-uid" as const;

const cardKey = Symbol("card");
export type TCardData = {
    [cardKey]: true;
    card: ProjectCard.TModel;
    rect: DOMRect;
};

export function getCardData({ card, rect }: Omit<TCardData, typeof cardKey>): TCardData {
    return {
        [cardKey]: true,
        rect,
        card,
    };
}

export function isCardData(value: Record<string | symbol, unknown>): value is TCardData {
    return Boolean(value[cardKey]);
}

export function isDraggingACard({ source }: { source: { data: Record<string | symbol, unknown> } }): boolean {
    return isCardData(source.data);
}

const cardDropTargetKey = Symbol("card-drop-target");
export type TCardDropTargetData = {
    [cardDropTargetKey]: true;
    card: ProjectCard.TModel;
};

export function isCardDropTargetData(value: Record<string | symbol, unknown>): value is TCardDropTargetData {
    return Boolean(value[cardDropTargetKey]);
}

export function getCardDropTargetData({ card }: Omit<TCardDropTargetData, typeof cardDropTargetKey>): TCardDropTargetData {
    return {
        [cardDropTargetKey]: true,
        card,
    };
}

const columnKey = Symbol("column");
export type TColumnData = {
    [columnKey]: true;
    column: ProjectColumn.TModel;
};

export function getColumnData({ column }: Omit<TColumnData, typeof columnKey>): TColumnData {
    return {
        [columnKey]: true,
        column,
    };
}

export function isColumnData(value: Record<string | symbol, unknown>): value is TColumnData {
    return Boolean(value[columnKey]);
}

export function isDraggingAColumn({ source }: { source: { data: Record<string | symbol, unknown> } }): boolean {
    return isColumnData(source.data);
}

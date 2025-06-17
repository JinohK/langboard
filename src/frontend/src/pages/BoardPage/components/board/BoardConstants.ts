import { TSettings, TSymbolSet } from "@/core/helpers/dnd/types";
import { ProjectCardRelationship } from "@/core/models";

export interface IBoardColumnCardContextParams {
    setFilters: (relationshipType: ProjectCardRelationship.TRelationship) => void;
}

export const BOARD_DND_SETTINGS: TSettings = {
    isMoreObvious: false,
    isOverElementAutoScrollEnabled: true,
    rootScrollSpeed: "fast" as const,
    columnScrollSpeed: "standard" as const,
    isFPSPanelEnabled: false,
    isCPUBurnEnabled: false,
    isOverflowScrollingEnabled: true,
};

export const BOARD_DND_SYMBOL_SET: TSymbolSet = {
    column: Symbol("column"),
    row: Symbol("card"),
    droppable: Symbol("card-drop-target"),
};

export const BLOCK_BOARD_PANNING_ATTR = "data-block-board-panning" as const;
export const HOVER_CARD_UID_ATTR = "data-hover-card-uid" as const;

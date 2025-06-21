import { TColumnRowSettings, TColumnRowSymbolSet } from "@/core/helpers/dnd/types";
import { ProjectCardRelationship } from "@/core/models";

export interface IBoardColumnCardContextParams {
    setFilters: (relationshipType: ProjectCardRelationship.TRelationship) => void;
}

export const BOARD_DND_SETTINGS: TColumnRowSettings = {
    isMoreObvious: false,
    isOverElementAutoScrollEnabled: true,
    rootScrollSpeed: "fast" as const,
    columnScrollSpeed: "standard" as const,
    isFPSPanelEnabled: false,
    isCPUBurnEnabled: false,
    isOverflowScrollingEnabled: true,
};

export const BOARD_DND_SYMBOL_SET: TColumnRowSymbolSet = {
    column: Symbol("column"),
    columnDroppable: Symbol("column-drop-target"),
    row: Symbol("card"),
    rowDroppable: Symbol("card-drop-target"),
};

export const BLOCK_BOARD_PANNING_ATTR = "data-block-board-panning" as const;
export const HOVER_CARD_UID_ATTR = "data-hover-card-uid" as const;

import { TColumnRowSettings, TColumnRowSymbolSet } from "@/core/helpers/dnd/types";

export const BOARD_CARD_CHECK_DND_SETTINGS: TColumnRowSettings = {
    isMoreObvious: false,
    isOverElementAutoScrollEnabled: true,
    rootScrollSpeed: "fast" as const,
    columnScrollSpeed: "standard" as const,
    isFPSPanelEnabled: false,
    isCPUBurnEnabled: false,
    isOverflowScrollingEnabled: true,
};

export const BOARD_CARD_CHECK_DND_SYMBOL_SET: TColumnRowSymbolSet = {
    column: Symbol("checklist"),
    columnDroppable: Symbol("checklist-drop-target"),
    row: Symbol("checkitem"),
    rowDroppable: Symbol("checkitem-drop-target"),
};

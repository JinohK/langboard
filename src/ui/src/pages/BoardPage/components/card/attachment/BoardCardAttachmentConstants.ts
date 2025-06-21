import { TSingleRowSettings, TSingleSymbolSet } from "@/core/helpers/dnd/types";

export const BOARD_CARD_ATTACHMENT_DND_SETTINGS: TSingleRowSettings = {
    isOverElementAutoScrollEnabled: true,
    rootScrollSpeed: "fast" as const,
    isOverflowScrollingEnabled: true,
};

export const BOARD_CARD_ATTACHMENT_DND_SYMBOL_SET: TSingleSymbolSet = {
    root: Symbol("attachment-list"),
    row: Symbol("attachment"),
};

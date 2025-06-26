import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/dist/types/internal-types";

export type TColumnRowSymbolSet = {
    column: symbol;
    columnDroppable: symbol;
    row: symbol;
    rowDroppable: symbol;
};

export type TColumnRowSettings = {
    isMoreObvious: bool;
    isOverElementAutoScrollEnabled: true;
    rootScrollSpeed: "fast" | "standard";
    columnScrollSpeed: "fast" | "standard";
    isFPSPanelEnabled: bool;
    isCPUBurnEnabled: bool;
    isOverflowScrollingEnabled: true;
};

export type TSingleRowSettings = {
    isOverElementAutoScrollEnabled: true;
    rootScrollSpeed: "fast" | "standard";
    isOverflowScrollingEnabled: true;
};

export type TColumnData<TModel extends TOrderableModel<TOrderableModelName>> = {
    [symbol: symbol]: bool;
    column: TModel;
    rect: DOMRect;
};

export type TColumnDroppableTargetData<TModel extends TOrderableModel<TOrderableModelName>> = {
    [symbol: symbol]: bool;
    column: TModel;
};

export type TRowData<TModel extends TOrderableModel<TOrderableModelName>> = {
    [symbol: symbol]: bool;
    row: TModel;
    rect: DOMRect;
};

export type TRowDroppableTargetData<TModel extends TOrderableModel<TOrderableModelName>> = {
    [symbol: symbol]: bool;
    row: TModel;
};

export type TColumnState =
    | {
          type: "is-row-over";
          isOverChildRow: bool;
          dragging: DOMRect;
      }
    | {
          type: "is-column-over";
          dragging: DOMRect;
          closestEdge: Edge;
      }
    | {
          type: "idle";
      }
    | {
          type: "is-dragging";
      };

export type TRowState =
    | {
          type: "idle";
      }
    | {
          type: "is-dragging";
      }
    | {
          type: "is-dragging-and-left-self";
      }
    | {
          type: "is-over";
          dragging: DOMRect;
          closestEdge: Edge;
      }
    | {
          type: "preview";
          container: HTMLElement;
          dragging: DOMRect;
      };

export type TSingleSymbolSet = {
    root: symbol;
    row: symbol;
};

export type TSingleRowData<TModel extends TOrderableModel<TOrderableModelName>> = {
    [symbol: symbol]: bool;
    row: TModel;
    rect: DOMRect;
};

export type TSingleRowDroppableTargetData<TModel extends TOrderableModel<TOrderableModelName>> = {
    [symbol: symbol]: bool;
    row: TModel;
};

export type TSingleRowState =
    | { type: "idle" }
    | { type: "is-dragging" }
    | { type: "is-over"; dragging: DOMRect; closestEdge: Edge }
    | { type: "preview"; container: HTMLElement; dragging: DOMRect };

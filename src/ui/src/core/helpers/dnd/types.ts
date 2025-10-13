import { Edge } from "@/core/helpers/dnd/auto-scroll/internal-types";
import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";

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

export type TDroppableAreaData = {
    [symbol: symbol]: bool;
    target: Element;
    rect: DOMRect;
};

export type TDroppableAreaTargetData = {
    [symbol: symbol]: bool;
    target: Element;
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

export type TDroppableAreaState =
    | {
          type: "is-row-over";
          dragging: DOMRect;
      }
    | {
          type: "is-column-over";
          dragging: DOMRect;
      }
    | {
          type: "idle";
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

interface IBaseDroppableArea {
    target: HTMLElement;
    allowedType: "all" | "column" | "row";
    columnSymbolSet?: symbol[];
    rowSymbolSet?: symbol[];
    areaSymbol: symbol;
    targetSymbol: symbol;
}

interface IAllDroppableArea<
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName> = TColumnModel,
> extends IBaseDroppableArea {
    allowedType: "all";
    columnSymbolSet: symbol[];
    rowSymbolSet: symbol[];
    onDrop?: (data: TColumnData<TColumnModel> | TRowData<TRowModel>) => void;
}

interface IColumnDroppableArea<TColumnModel extends TOrderableModel<TOrderableModelName>> extends IBaseDroppableArea {
    allowedType: "column";
    columnSymbolSet: symbol[];
    rowSymbolSet?: never;
    onDrop?: (data: TColumnData<TColumnModel>) => void;
}

interface IRowDroppableArea<TRowModel extends TOrderableModel<TOrderableModelName>> extends IBaseDroppableArea {
    allowedType: "row";
    columnSymbolSet?: never;
    rowSymbolSet: symbol[];
    onDrop?: (data: TColumnData<TRowModel>) => void;
}

export type TDroppableArea<
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName> = TColumnModel,
> = IAllDroppableArea<TColumnModel, TRowModel> | IColumnDroppableArea<TColumnModel> | IRowDroppableArea<TRowModel>;

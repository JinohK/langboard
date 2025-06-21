/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBaseModel, TBaseModelInstance } from "@/core/models/Base";
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

interface ISortableData extends IBaseModel {
    order: number;
}

export type TSortableData = ISortableData | TBaseModelInstance<ISortableData>;

export type TRowModelWithKey<TRowModel extends TSortableData> = TRowModel & Record<keyof TRowModel, any>;

export type TColumnData<TColumnModel extends TSortableData> = {
    [symbol: symbol]: bool;
    column: TColumnModel;
    rect: DOMRect;
};

export type TColumnDroppableTargetData<TColumnModel extends TSortableData> = {
    [symbol: symbol]: bool;
    column: TColumnModel;
};

export type TRowData<TRowModel extends TSortableData, TRow extends TRowModelWithKey<TRowModel>> = {
    [symbol: symbol]: bool;
    row: TRow;
    rect: DOMRect;
};

export type TRowDroppableTargetData<TRowModel extends TSortableData, TRow extends TRowModelWithKey<TRowModel>> = {
    [symbol: symbol]: bool;
    row: TRow;
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

export type TSingleRowData<TRowModel extends TSortableData> = {
    [symbol: symbol]: bool;
    row: TRowModelWithKey<TRowModel>;
    rect: DOMRect;
};

export type TSingleRowDroppableTargetData<TRowModel extends TSortableData> = {
    [symbol: symbol]: bool;
    row: TRowModelWithKey<TRowModel>;
};

export type TSingleRowState =
    | { type: "idle" }
    | { type: "is-dragging" }
    | { type: "is-over"; dragging: DOMRect; closestEdge: Edge }
    | { type: "preview"; container: HTMLElement; dragging: DOMRect };

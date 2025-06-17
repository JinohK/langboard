/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBaseModel, TBaseModelInstance } from "@/core/models/Base";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/dist/types/internal-types";

export type TSymbolSet = {
    column: symbol;
    row: symbol;
    droppable: symbol;
};

export type TSettings = {
    isMoreObvious: bool;
    isOverElementAutoScrollEnabled: true;
    rootScrollSpeed: "fast" | "standard";
    columnScrollSpeed: "fast" | "standard";
    isFPSPanelEnabled: bool;
    isCPUBurnEnabled: bool;
    isOverflowScrollingEnabled: true;
};

interface ISortableData extends IBaseModel {
    order: number;
}

export type TSortableData = ISortableData | TBaseModelInstance<ISortableData>;

export type TRowModelWithKey<TRowModel extends TSortableData> = TRowModel & Record<keyof TRowModel, any>;

export type TColumnData<TColumnModel extends TSortableData> = {
    column: TColumnModel;
};

export type TRowData<TRowModel extends TSortableData, TRow extends TRowModelWithKey<TRowModel>> = {
    row: TRow;
    rect: DOMRect;
};

export type TDroppableTargetData<TRowModel extends TSortableData, TRow extends TRowModelWithKey<TRowModel>> = {
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

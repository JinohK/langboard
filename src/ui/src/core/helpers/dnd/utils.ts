import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";

export interface ICanReorderByClosestEdgeProps {
    sourceIndex: number;
    targetIndex: number;
    closestEdge: Edge | null;
    isHorizontal?: bool;
}

export const canReorderByClosestEdge = ({ sourceIndex, targetIndex, closestEdge, isHorizontal }: ICanReorderByClosestEdgeProps) => {
    const isItemBeforeSource = sourceIndex === targetIndex - 1;
    const isItemAfterSource = sourceIndex === targetIndex + 1;

    const topLeft = isHorizontal ? "left" : "top";
    const bottomRight = isHorizontal ? "right" : "bottom";

    return !(isItemBeforeSource && closestEdge === topLeft) && !(isItemAfterSource && closestEdge === bottomRight);
};

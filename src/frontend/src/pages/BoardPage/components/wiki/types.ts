import { IMoreDroppableZoneCallbacks } from "@/core/hooks/useColumnRowSortable";
import { ProjectWiki } from "@/core/models";
import { UniqueIdentifier } from "@dnd-kit/core";

export interface IDraggableProjectWiki extends ProjectWiki.TModel {
    isInBin?: bool;
}

export type TMoreWikiTabDropzonCallbacks = Record<UniqueIdentifier, IMoreDroppableZoneCallbacks<IDraggableProjectWiki, IDraggableProjectWiki>>;

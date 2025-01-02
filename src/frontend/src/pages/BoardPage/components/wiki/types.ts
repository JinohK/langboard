import { IMoreDroppableZoneCallbacks } from "@/core/hooks/useColumnRowSortable";
import { ProjectWiki } from "@/core/models";
import { UniqueIdentifier } from "@dnd-kit/core";

export type TMoreWikiTabDropzonCallbacks = Record<UniqueIdentifier, IMoreDroppableZoneCallbacks<ProjectWiki.TModel, ProjectWiki.TModel>>;

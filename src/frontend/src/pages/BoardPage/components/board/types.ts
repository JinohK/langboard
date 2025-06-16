import { ProjectCardRelationship } from "@/core/models";

export interface IBoardColumnCardContextParams {
    HOVER_CARD_UID_ATTR: "data-hover-card-uid";
    setFilters: (relationshipType: ProjectCardRelationship.TRelationship) => void;
}

import { ProjectCardRelationship } from "@/core/models";

export interface IBoardColumnCardContextParams {
    HOVER_CARD_UID_ATTR: "data-hover-card-uid";
    isCollapseOpened: bool;
    setIsCollapseOpened: React.Dispatch<React.SetStateAction<bool>>;
    setFilters: (relationshipType: ProjectCardRelationship.TRelationship) => void;
}

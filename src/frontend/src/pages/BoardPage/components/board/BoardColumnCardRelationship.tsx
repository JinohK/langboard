import { Button } from "@/components/base";
import { ProjectCard, ProjectCardRelationship } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { cn } from "@/core/utils/ComponentUtils";
import { StringCase } from "@/core/utils/StringUtils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnCardRelationshipProps {
    card: ProjectCard.TModel;
    setFilters: (type: ProjectCardRelationship.TRelationship) => void;
    attributes: Record<string, unknown>;
}

const BoardColumnCardRelationship = memo(({ card, setFilters, attributes }: IBoardColumnCardRelationshipProps) => {
    return (
        <>
            <BoardColumnCardRelationshipButton type="parents" card={card} setFilters={setFilters} attributes={attributes} />
            <BoardColumnCardRelationshipButton type="children" card={card} setFilters={setFilters} attributes={attributes} />
        </>
    );
});

export interface IBoardColumnCardRelationshipButtonProps {
    type: ProjectCardRelationship.TRelationship;
    card: ProjectCard.TModel;
    setFilters: (type: ProjectCardRelationship.TRelationship) => void;
    attributes: Record<string, unknown>;
}

const BoardColumnCardRelationshipButton = memo(({ type, card, setFilters, attributes }: IBoardColumnCardRelationshipButtonProps) => {
    const [t] = useTranslation();
    const isParent = type === "parents";
    const { filterRelationships } = useBoardRelationshipController();
    const flatRelationships = card.useForeignField<ProjectCardRelationship.TModel>("relationships");
    const relationships = filterRelationships(card.uid, flatRelationships, isParent);

    if (!relationships.length) {
        return null;
    }

    const relationshipCount = relationships.length > 99 ? "99" : relationships.length;

    return (
        <Button
            size="icon-sm"
            className={cn(
                "absolute top-1/2 z-30 block -translate-y-1/2 transform rounded-full text-xs hover:bg-primary/70",
                isParent ? "-left-3" : "-right-3"
            )}
            title={t(`project.${new StringCase(type).toPascal()}`)}
            titleSide={isParent ? "right" : "left"}
            onClick={() => setFilters(type)}
            {...attributes}
        >
            +{relationshipCount}
        </Button>
    );
});

export default BoardColumnCardRelationship;

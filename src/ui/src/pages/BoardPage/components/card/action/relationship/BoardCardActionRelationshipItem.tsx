import { Button, Flex } from "@/components/base";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ProjectCard, ProjectCardRelationship } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo } from "react";

export interface IBoardCardActionRelationshipItemProps {
    type: ProjectCardRelationship.TRelationship;
    relationship: ProjectCardRelationship.TModel;
}

const BoardCardActionRelationshipItem = memo(({ type, relationship }: IBoardCardActionRelationshipItemProps) => {
    const navigate = usePageNavigateRef();
    const { projectUID, card } = useBoardCard();
    const isParent = type === "parents";
    const relationshipType = relationship.relationship_type;
    const targetCardUID = relationship.parent_card_uid === card.uid ? relationship.child_card_uid : relationship.parent_card_uid;
    const targetCard = ProjectCard.Model.getModel(targetCardUID)!;
    const targetCardTitle = targetCard.useField("title");
    const name = relationshipType.useField(isParent ? "parent_name" : "child_name");

    const toRelatedCard = () => {
        navigate(ROUTES.BOARD.CARD(projectUID, targetCardUID));
    };

    return (
        <Button
            type="button"
            variant="ghost"
            title={`${name} > ${targetCardTitle}`}
            className="justify-start rounded-none border-b p-0"
            onClick={toRelatedCard}
        >
            <Flex items="center" gap="2" py="1" px="2" className="truncate">
                <span>{name}</span>
                <span className="text-muted-foreground">&gt;</span>
                <span className="truncate">{targetCardTitle}</span>
            </Flex>
        </Button>
    );
});

export default BoardCardActionRelationshipItem;

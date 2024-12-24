import { Button, Flex, IconComponent } from "@/components/base";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { ProjectCard } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { memo, useRef } from "react";

export interface IBoardCardActionRelationshipItemProps {
    type: "parents" | "children";
    relationship: ProjectCard.IRelationship;
}

const BoardCardActionRelationshipItem = memo(({ type, relationship }: IBoardCardActionRelationshipItemProps) => {
    const navigate = useRef(usePageNavigate());
    const { projectUID } = useBoardCard();
    const isParent = type === "parents";

    const icon = isParent ? relationship.parent_icon : relationship.child_icon;
    const name = isParent ? relationship.parent_name : relationship.child_name;

    const toRelatedCard = () => {
        navigate.current(ROUTES.BOARD.CARD(projectUID, relationship.related_card.uid));
    };

    return (
        <Button
            type="button"
            variant="ghost"
            title={`${name} > ${relationship.related_card.title}`}
            className="justify-start rounded-none border-b p-0"
            onClick={toRelatedCard}
        >
            <Flex items="center" gap="2" py="1" px="2" className="truncate">
                <Flex items="center" gap="1">
                    {icon && <IconComponent icon={icon} size="4" />}
                    {name}
                </Flex>
                <span className="text-muted-foreground">&gt;</span>
                <span className="truncate">{relationship.related_card.title}</span>
            </Flex>
        </Button>
    );
});

export default BoardCardActionRelationshipItem;

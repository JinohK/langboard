import { Flex, ScrollArea } from "@/components/base";
import { ProjectCard } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardCardActionRelationshipItem from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationshipItem";
import { memo, useEffect, useState } from "react";

export interface IBoardCardActionRelationshipListProps {
    type: "parents" | "children";
    relationships: ProjectCard.IRelationship[];
}

const BoardCardActionRelationshipList = memo(({ type, relationships: flatRelationships }: IBoardCardActionRelationshipListProps) => {
    const isParent = type === "parents";
    const [relationships, setRelationships] = useState(
        flatRelationships.filter((relationship) => (isParent ? relationship.is_parent : !relationship.is_parent))
    );

    useEffect(() => {
        setRelationships(() => flatRelationships.filter((relationship) => (isParent ? relationship.is_parent : !relationship.is_parent)));
    }, [flatRelationships]);

    return (
        <ScrollArea.Root className="border">
            <Flex direction="col" position="relative" textSize="sm" className="h-[min(theme(spacing.48),35vh)] select-none">
                {relationships.map((relationship) => (
                    <BoardCardActionRelationshipItem key={createShortUUID()} type={type} relationship={relationship} />
                ))}
            </Flex>
        </ScrollArea.Root>
    );
});

export default BoardCardActionRelationshipList;

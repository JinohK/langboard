import { Button } from "@/components/base";
import useCardRelationshipsUpdatedHandlers from "@/controllers/socket/card/useCardRelationshipsUpdatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { ProjectCard } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { StringCase } from "@/core/utils/StringUtils";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardColumnCardRelationshipProps {
    card: ProjectCard.IBoard;
    setFilters: (type: "parents" | "children") => void;
    attributes: Record<string, unknown>;
}

const BoardColumnCardRelationship = memo(({ card, setFilters, attributes }: IBoardColumnCardRelationshipProps) => {
    const { project, socket } = useBoard();
    const [parentRelationships, setParentRelationships] = useState(card.relationships.parents);
    const [childRelationships, setChildRelationships] = useState(card.relationships.children);
    const handlers = useCardRelationshipsUpdatedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            if (data.card_uid === card.uid) {
                card.relationships.parents = data.parent_card_uids;
                card.relationships.children = data.child_card_uids;
                setParentRelationships(() => [...card.relationships.parents]);
                setChildRelationships(() => [...card.relationships.children]);
                return;
            }

            const relationship = data.relationships.find((relationship) => relationship.related_card.uid === card.uid);
            if (!relationship) {
                card.relationships.parents = card.relationships.parents.filter((uid) => uid !== data.card_uid);
                card.relationships.children = card.relationships.children.filter((uid) => uid !== data.card_uid);
                setParentRelationships(() => [...card.relationships.parents]);
                setChildRelationships(() => [...card.relationships.children]);
                return;
            }

            if (data.parent_card_uids.includes(card.uid)) {
                card.relationships.children = card.relationships.children.filter((uid) => uid !== relationship.related_card.uid);
                card.relationships.children.push(relationship.related_card.uid);
                setChildRelationships(() => [...card.relationships.children]);
            } else if (data.child_card_uids.includes(card.uid)) {
                card.relationships.parents = card.relationships.parents.filter((uid) => uid !== relationship.related_card.uid);
                card.relationships.parents.push(relationship.related_card.uid);
                setParentRelationships(() => [...card.relationships.parents]);
            }
        },
    });
    useSwitchSocketHandlers({ socket, handlers });

    return (
        <>
            <BoardColumnCardRelationshipButton type="parents" relationships={parentRelationships} setFilters={setFilters} attributes={attributes} />
            <BoardColumnCardRelationshipButton type="children" relationships={childRelationships} setFilters={setFilters} attributes={attributes} />
        </>
    );
});

export interface IBoardColumnCardRelationshipButtonProps {
    type: "parents" | "children";
    relationships: string[];
    setFilters: (type: "parents" | "children") => void;
    attributes: Record<string, unknown>;
}

const BoardColumnCardRelationshipButton = memo(
    ({ type, relationships: flatRelationships, setFilters, attributes }: IBoardColumnCardRelationshipButtonProps) => {
        const [t] = useTranslation();
        const [relationships, setRelationships] = useState(flatRelationships);
        const isParent = type === "parents";

        useEffect(() => {
            setRelationships(() => [...flatRelationships]);
        }, [flatRelationships]);
        if (!relationships.length) {
            return null;
        }

        const relationshipCount = relationships.length > 99 ? "99" : relationships.length;

        return (
            <Button
                size="icon-sm"
                className={cn(
                    "absolute top-1/2 z-20 block -translate-y-1/2 transform rounded-full text-xs hover:bg-primary/70",
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
    }
);

export default BoardColumnCardRelationship;

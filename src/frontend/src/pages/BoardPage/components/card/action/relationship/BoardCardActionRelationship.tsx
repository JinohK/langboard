import useCardRelationshipsUpdatedHandlers from "@/controllers/socket/card/useCardRelationshipsUpdatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardActionRelationshipButton from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationshipButton";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { useState } from "react";

export interface IBoardCardActionRelationshipProps extends ISharedBoardCardActionProps {}

function BoardCardActionRelationship({ buttonClassName }: IBoardCardActionRelationshipProps) {
    const { projectUID, card, socket } = useBoardCard();
    const [relationships, setRelationships] = useState(card.relationships);
    const handlers = useCardRelationshipsUpdatedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            if (data.card_uid === card.uid) {
                card.relationships = data.relationships;
                setRelationships(() => [...card.relationships]);
                return;
            }

            const relationship = data.relationships.find((relationship) => relationship.related_card.uid === card.uid);
            if (relationship) {
                if (data.parent_card_uids.includes(card.uid) || data.child_card_uids.includes(card.uid)) {
                    card.relationships = card.relationships.filter((relationship) => relationship.related_card.uid !== data.card_uid);
                    card.relationships.push({
                        ...relationship,
                        is_parent: !relationship.is_parent,
                    });
                }
            } else {
                if (!card.relationships.some((relationship) => relationship.related_card.uid === card.uid)) {
                    return;
                }

                card.relationships = card.relationships.filter((relationship) => relationship.related_card.uid !== data.card_uid);
            }

            setRelationships(() => [...card.relationships]);
        },
    });
    useSwitchSocketHandlers({ socket, handlers });

    return (
        <>
            <BoardCardActionRelationshipButton type="parents" relationships={relationships} buttonClassName={buttonClassName} />
            <BoardCardActionRelationshipButton type="children" relationships={relationships} buttonClassName={buttonClassName} />
        </>
    );
}

export default BoardCardActionRelationship;

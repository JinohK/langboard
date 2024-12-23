import { Flex } from "@/components/base";
import useCardLabelsUpdatedHandlers from "@/controllers/socket/card/useCardLabelsUpdatedHandlers";
import useProjectLabelDeletedHandlers from "@/controllers/socket/project/label/useProjectLabelDeletedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardLabel from "@/pages/BoardPage/components/card/label/BoardCardLabel";
import { useState } from "react";

function BoardCardLabelList(): JSX.Element {
    const { projectUID, card, socket } = useBoardCard();
    const [labels, setLabels] = useState(card.labels);
    const projectLabelDeletedHandler = useProjectLabelDeletedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            setLabels((prev) => {
                const newLabels = prev.filter((label) => label.uid !== data.uid);
                card.labels = newLabels;
                return newLabels;
            });
        },
    });
    const cardLabelsUpdatedHandler = useCardLabelsUpdatedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.labels = data.labels;
            setLabels(data.labels);
        },
    });
    useSwitchSocketHandlers({ socket, handlers: [projectLabelDeletedHandler, cardLabelsUpdatedHandler] });

    return (
        <Flex inline wrap="wrap" gap="1.5">
            {labels.map((label) => (
                <BoardCardLabel key={`board-card-label-${label.uid}`} label={label} />
            ))}
        </Flex>
    );
}

export default BoardCardLabelList;

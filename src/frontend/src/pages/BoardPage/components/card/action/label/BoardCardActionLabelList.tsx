import { Checkbox, Flex, Label, ScrollArea } from "@/components/base";
import useCardLabelsUpdatedHandlers from "@/controllers/socket/card/useCardLabelsUpdatedHandlers";
import useProjectLabelCreatedHandlers from "@/controllers/socket/project/label/useProjectLabelCreatedHandlers";
import useProjectLabelDeletedHandlers from "@/controllers/socket/project/label/useProjectLabelDeletedHandlers";
import useProjectLabelOrderChangedHandlers from "@/controllers/socket/project/label/useProjectLabelOrderChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardActionLabel from "@/pages/BoardPage/components/card/action/label/BoardCardActionLabel";
import { arrayMove } from "@dnd-kit/sortable";
import { memo, useState } from "react";

export interface IBoardCardActionLabelListProps {
    selectedLabelUIDs: string[];
    setSelectedLabelUIDs: React.Dispatch<React.SetStateAction<string[]>>;
}

const BoardCardActionLabelList = memo(({ selectedLabelUIDs, setSelectedLabelUIDs }: IBoardCardActionLabelListProps) => {
    const { projectUID, card, socket } = useBoardCard();
    const [projectLabels, setProjectLabels] = useState(card.project_labels);
    const projectLabelCreatedHandler = useProjectLabelCreatedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            setProjectLabels((prev) => {
                const newLabels = prev.filter((label) => label.uid !== data.label.uid).concat(data.label);
                card.project_labels = newLabels;
                return newLabels;
            });
        },
    });
    const projectLabelOrderChangedHandler = useProjectLabelOrderChangedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            const label = projectLabels.find((label) => label.uid === data.uid);
            if (!label) {
                return;
            }

            setProjectLabels((prev) => {
                const newLabels = arrayMove(prev, label.order, data.order).map((col, i) => ({ ...col, order: i }));
                card.project_labels = newLabels;
                return newLabels;
            });
        },
    });
    const projectLabelDeletedHandler = useProjectLabelDeletedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            setProjectLabels((prev) => {
                const newLabels = prev.filter((label) => label.uid !== data.uid);
                card.project_labels = newLabels;
                return newLabels;
            });
            card.labels = card.labels.filter((label) => label.uid !== data.uid);
            setSelectedLabelUIDs((prev) => prev.filter((uid) => uid !== data.uid));
        },
    });
    const cardLabelsUpdatedHandler = useCardLabelsUpdatedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.labels = data.labels;
            setSelectedLabelUIDs(() => data.labels.map((label) => label.uid));
        },
    });
    useSwitchSocketHandlers({
        socket,
        handlers: [projectLabelCreatedHandler, projectLabelOrderChangedHandler, projectLabelDeletedHandler, cardLabelsUpdatedHandler],
    });

    const changeSelectedState = (labelUID: string) => {
        if (selectedLabelUIDs.includes(labelUID)) {
            setSelectedLabelUIDs((prev) => prev.filter((uid) => uid !== labelUID));
        } else {
            setSelectedLabelUIDs((prev) => [...prev, labelUID]);
        }
    };

    return (
        <ScrollArea.Root className="border border-dashed">
            <Flex direction="col" position="relative" className="h-[min(theme(spacing.48),35vh)] select-none">
                {projectLabels.map((label) => (
                    <Label
                        key={`board-card-action-label-${label.uid}`}
                        display="flex"
                        items="center"
                        gap="3"
                        p="2"
                        cursor="pointer"
                        className="hover:bg-secondary/40"
                    >
                        <Checkbox checked={selectedLabelUIDs.includes(label.uid)} onCheckedChange={() => changeSelectedState(label.uid)} />
                        <BoardCardActionLabel label={label} />
                    </Label>
                ))}
            </Flex>
        </ScrollArea.Root>
    );
});

export default BoardCardActionLabelList;

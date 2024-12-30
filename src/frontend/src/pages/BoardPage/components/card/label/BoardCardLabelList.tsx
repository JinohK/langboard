import { Flex } from "@/components/base";
import { ProjectLabel } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardLabel from "@/pages/BoardPage/components/card/label/BoardCardLabel";

function BoardCardLabelList(): JSX.Element {
    const { card } = useBoardCard();
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    ProjectLabel.Model.subscribe("DELETION", `board-card-label-list-${card.uid}`, (uids) => {
        const newLabels = labels.filter((label) => !uids.includes(label.uid));
        card.labels = newLabels;
    });

    return (
        <Flex inline wrap="wrap" gap="1.5">
            {labels.map((label) => (
                <BoardCardLabel key={`board-card-label-${label.uid}`} label={label} />
            ))}
        </Flex>
    );
}

export default BoardCardLabelList;

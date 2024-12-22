import { Button, IconComponent } from "@/components/base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";

export interface IBoardCardRelationshipProps {
    type: "parent" | "child";
}

function BoardCardRelationship({ type }: IBoardCardRelationshipProps) {
    const { card } = useBoardCard();

    return (
        <Button type="button" className="rounded-full">
            <IconComponent icon="git-fork" className={type === "parent" ? "" : "rotate-180"} />
        </Button>
    );
}

export default BoardCardRelationship;

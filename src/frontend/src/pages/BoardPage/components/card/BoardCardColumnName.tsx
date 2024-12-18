import { Skeleton } from "@/components/base";
import useBoardColumnNameChangedHandlers from "@/controllers/socket/board/useBoardColumnNameChangedHandlers";
import useCardColumnChangedHandlers from "@/controllers/socket/card/useCardColumnChangedHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useEffect, useState } from "react";

export function SkeletonBoardCardColumnName() {
    return <Skeleton h="5" className="w-1/6" />;
}

function BoardCardColumnName(): JSX.Element {
    const { projectUID, card, socket } = useBoardCard();
    const [columnName, setColumnName] = useState(card.column_name);
    const { on: onCardColumnChanged } = useCardColumnChangedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.column_uid = data.column_uid;
            card.column_name = data.column_name;
            setColumnName(data.column_name);
        },
    });
    const { on: onBoardColumnNameChanged } = useBoardColumnNameChangedHandlers({
        socket,
        projectUID,
        callback: (data) => {
            if (data.uid !== card.column_uid || data.name === card.column_name) {
                return;
            }

            card.column_name = data.name;
            setColumnName(data.name);
        },
    });

    useEffect(() => {
        const { off: offCardColumnChanged } = onCardColumnChanged();
        const { off: offBoardColumnNameChanged } = onBoardColumnNameChanged();

        return () => {
            offCardColumnChanged();
            offBoardColumnNameChanged();
        };
    }, []);

    return <>{columnName}</>;
}

export default BoardCardColumnName;

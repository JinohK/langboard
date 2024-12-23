import { Skeleton } from "@/components/base";
import useCardColumnChangedHandlers from "@/controllers/socket/card/useCardColumnChangedHandlers";
import useProjectColumnNameChangedHandlers from "@/controllers/socket/project/column/useProjectColumnNameChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useState } from "react";

export function SkeletonBoardCardColumnName() {
    return <Skeleton h="5" className="w-1/6" />;
}

function BoardCardColumnName(): JSX.Element {
    const { projectUID, card, socket } = useBoardCard();
    const [columnName, setColumnName] = useState(card.column_name);
    const cardColumnChangedHandler = useCardColumnChangedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            card.column_uid = data.column_uid;
            card.column_name = data.column_name;
            setColumnName(data.column_name);
        },
    });
    const projectColumnNameChangedHandler = useProjectColumnNameChangedHandlers({
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
    useSwitchSocketHandlers({ socket, handlers: [cardColumnChangedHandler, projectColumnNameChangedHandler] });

    return <>{columnName}</>;
}

export default BoardCardColumnName;

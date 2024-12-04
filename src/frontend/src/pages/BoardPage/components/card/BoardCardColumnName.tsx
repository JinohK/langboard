import useBoardCardOrderChangedHandlers from "@/controllers/socket/board/useBoardCardOrderChangedHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useEffect, useState } from "react";

function BoardCardColumnName(): JSX.Element {
    const { card, socket } = useBoardCard();
    const [columnName, setColumnName] = useState(card.column_name);
    const { on: onCardOrderChanged } = useBoardCardOrderChangedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            card.column_uid = data.column_uid;
            card.column_name = data.column_name;
            setColumnName(data.column_name);
        },
    });

    useEffect(() => {
        const { off } = onCardOrderChanged();

        return () => {
            off();
        };
    }, []);

    return <>{columnName}</>;
}

export default BoardCardColumnName;

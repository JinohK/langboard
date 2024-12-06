import useCardColumnChangedHandlers from "@/controllers/socket/card/useCardColumnChangedHandlers";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useEffect, useState } from "react";

function BoardCardColumnName(): JSX.Element {
    const { card, socket } = useBoardCard();
    const [columnName, setColumnName] = useState(card.column_name);
    const { on: onCardColumnChanged } = useCardColumnChangedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            card.column_uid = data.column_uid;
            card.column_name = data.column_name;
            setColumnName(data.column_name);
        },
    });

    useEffect(() => {
        const { off } = onCardColumnChanged();

        return () => {
            off();
        };
    }, []);

    return <>{columnName}</>;
}

export default BoardCardColumnName;

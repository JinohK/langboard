import useColumnOrderChangedHandlers, { IUseColumnOrderChangedHandlersProps } from "@/controllers/socket/shared/useColumnOrderChangedHandlers";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";

export interface IColumn {
    uid: string;
    order: number;
}

export interface IUseReorderColumnProps<TColumn extends IColumn> {
    type: IUseColumnOrderChangedHandlersProps["type"];
    eventNameParams?: IUseColumnOrderChangedHandlersProps["params"];
    topicId: string;
    columns: TColumn[];
    socket: ISocketContext;
}

function useReorderColumn<TColumn extends IColumn>({
    type,
    eventNameParams,
    topicId,
    columns: flatColumns,
    socket,
}: IUseReorderColumnProps<TColumn>) {
    const [columns, setColumns] = useState<TColumn[]>(flatColumns);
    const { on: onColumnOrderChanged, send: sendColumnOrderChanged } = useColumnOrderChangedHandlers({
        socket,
        type,
        topicId,
        params: eventNameParams,
        callback: (data) => {
            setColumns((prev) =>
                arrayMove(
                    prev,
                    prev.findIndex((col) => col.uid === data.uid),
                    data.order
                ).map((col, i) => ({ ...col, order: i }))
            );
        },
    });

    useEffect(() => {
        const { off } = onColumnOrderChanged();

        return () => {
            off();
        };
    }, []);

    const reorder = (column: TColumn, newIndex: number) => {
        if (column.order === newIndex) {
            return false;
        }

        setColumns((prev) => arrayMove(prev, column.order, newIndex).map((col, i) => ({ ...col, order: i })));
        return true;
    };

    return { columns, setColumns, reorder, sendColumnOrderChanged };
}

export default useReorderColumn;

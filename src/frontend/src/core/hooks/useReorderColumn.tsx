import useColumnOrderChangedHandlers, { IUseColumnOrderChangedHandlersProps } from "@/controllers/socket/shared/useColumnOrderChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { TBaseModelInstance } from "@/core/models/Base";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";

export interface IColumn {
    uid: string;
    order: number;
}

export interface IUseReorderColumnProps<TColumn extends TBaseModelInstance<IColumn>> {
    type: IUseColumnOrderChangedHandlersProps["type"];
    eventNameParams?: IUseColumnOrderChangedHandlersProps["params"];
    topicId: string;
    columns: TColumn[];
    socket: ISocketContext;
}

function useReorderColumn<TColumn extends TBaseModelInstance<IColumn>>({
    type,
    eventNameParams,
    topicId,
    columns: flatColumns,
    socket,
}: IUseReorderColumnProps<TColumn>) {
    const [columns, setColumns] = useState<TColumn[]>(flatColumns);
    const handlers = useMemo(
        () =>
            useColumnOrderChangedHandlers({
                type,
                topicId,
                params: eventNameParams,
                callback: (data) => {
                    setColumns((prev) =>
                        arrayMove(
                            prev,
                            prev.findIndex((col) => col.uid === data.uid),
                            data.order
                        ).map((col, i) => {
                            const column = col as unknown as IColumn;
                            if (column.order !== i) {
                                column.order = i;
                            }
                            return col;
                        })
                    );
                },
            }),
        [type, topicId, eventNameParams, setColumns]
    );
    useSwitchSocketHandlers({ socket, handlers, dependencies: [handlers] });

    const reorder = (column: TColumn, newIndex: number) => {
        const columnOrder = (column as unknown as IColumn).order;
        if (columnOrder === newIndex) {
            return false;
        }

        setColumns((prev) =>
            arrayMove(prev, columnOrder, newIndex).map((arrayCol, i) => {
                const col = arrayCol as unknown as IColumn;
                if (col.order !== i) {
                    col.order = i;
                }
                return arrayCol;
            })
        );
        return true;
    };

    useEffect(() => {
        setColumns(() => flatColumns.sort((a, b) => a.order - b.order));
    }, [flatColumns]);

    return { columns, setColumns, reorder, sendColumnOrderChanged: handlers.send };
}

export default useReorderColumn;

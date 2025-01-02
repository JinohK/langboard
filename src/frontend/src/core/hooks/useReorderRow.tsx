import useRowOrderChangedHandlers, { IUseRowOrderChangedHandlersProps } from "@/controllers/socket/shared/useRowOrderChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { TBaseModelInstance } from "@/core/models/Base";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { arrayMove } from "@dnd-kit/sortable";

export interface IRow {
    uid: string;
    order: number;
}

export interface IUseReorderRowProps<TRow extends TBaseModelInstance<IRow>, TRowColumnKey extends keyof TRow> {
    type: IUseRowOrderChangedHandlersProps["type"];
    eventNameParams?: IUseRowOrderChangedHandlersProps["params"];
    topicId: string;
    allRowsMap: Record<string, TRow>;
    rows: TRow[];
    columnKey: TRowColumnKey;
    currentColumnId: TRow[TRowColumnKey];
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
}

function useReorderRow<TRow extends TBaseModelInstance<IRow>, TRowColumn extends keyof TRow>({
    type,
    eventNameParams,
    topicId,
    allRowsMap,
    rows,
    columnKey,
    currentColumnId,
    socket,
    updater,
}: IUseReorderRowProps<TRow, TRowColumn>) {
    const [_, forceUpdate] = updater;
    const handlers = useRowOrderChangedHandlers({
        type,
        topicId,
        params: eventNameParams,
        callback: (data) => {
            switch (data.move_type) {
                case "from_column":
                    removeFromColumn(data.uid);
                    break;
                case "to_column":
                    moveToColumn(data.uid, data.order, currentColumnId);
                    break;
                case "in_column":
                    reorderInColumn(data.uid, data.order);
                    break;
            }
        },
    });
    useSwitchSocketHandlers({ socket, handlers });

    const moveToColumn = <TRowColumn extends keyof TRow>(uid: string, index: number, columnId: TRow[TRowColumn]) => {
        const targetRow = allRowsMap[uid] as TRow;
        let targetRowIndex;
        if (!rows.some((row) => row.uid === uid)) {
            rows.push(targetRow);
            targetRowIndex = rows.length - 1;
        } else {
            targetRowIndex = rows.findIndex((row) => row.uid === uid);
        }

        arrayMove(rows, targetRowIndex, index).forEach((row, i) => {
            allRowsMap[row.uid].order = i;
        });

        (targetRow as Record<keyof TRow, unknown>)[columnKey] = columnId;
        forceUpdate();
    };

    const removeFromColumn = (uid: string) => {
        rows.filter((row) => row.uid !== uid).forEach((row, i) => {
            allRowsMap[row.uid].order = i;
        });
        forceUpdate();
    };

    const reorderInColumn = (uid: string, index: number) => {
        arrayMove(rows, rows.findIndex((row) => row.uid === uid)!, index).forEach((row, i) => {
            allRowsMap[row.uid].order = i;
        });
        forceUpdate();
    };

    return { moveToColumn, removeFromColumn, reorderInColumn, sendRowOrderChanged: handlers.send };
}

export default useReorderRow;

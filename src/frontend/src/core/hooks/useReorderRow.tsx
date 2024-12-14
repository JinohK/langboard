import useRowOrderChangedHandlers, { IUseRowOrderChangedHandlersProps } from "@/controllers/socket/shared/useRowOrderChangedHandlers";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useEffect } from "react";

export interface IRow {
    uid: string;
    order: number;
}

export interface IUseReorderRowProps<TRow extends IRow, TRowColumn extends keyof TRow> {
    type: IUseRowOrderChangedHandlersProps["type"];
    eventNameParams?: IUseRowOrderChangedHandlersProps["params"];
    topicId: string;
    allRowsMap: Record<string, TRow>;
    rows: TRow[];
    columnKey: TRowColumn;
    currentColumnId: TRow[TRowColumn];
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
}

function useReorderRow<TRow extends IRow, TRowColumn extends keyof TRow>({
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
    const { on: onRowOrderChanged, send: sendRowOrderChanged } = useRowOrderChangedHandlers({
        socket,
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

            forceUpdate();
        },
    });

    useEffect(() => {
        const { off } = onRowOrderChanged();

        return () => {
            off();
        };
    }, []);

    const moveToColumn = <TRowColumn extends keyof TRow>(uid: string, index: number, columnId: TRow[TRowColumn]) => {
        let isUpdated = false;
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            if (i === index) {
                isUpdated = true;
                continue;
            }
            allRowsMap[row.uid].order = isUpdated ? i + 1 : i;
        }
        allRowsMap[uid].order = index;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (allRowsMap[uid] as any)[columnKey] = columnId;
    };

    const removeFromColumn = (uid: string) => {
        let isUpdated = false;
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            if (row.uid === uid) {
                isUpdated = true;
                continue;
            }
            allRowsMap[row.uid].order = isUpdated ? i - 1 : i;
        }
    };

    const reorderInColumn = (uid: string, index: number) => {
        let isTargetCardPassed = false;
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            if (row.uid === uid) {
                isTargetCardPassed = true;
                continue;
            }

            let numToAdd = row.order <= index ? 0 : 1;
            numToAdd -= isTargetCardPassed ? 1 : 0;

            row.order = i + numToAdd;
        }
        allRowsMap[uid].order = index;
    };

    return { moveToColumn, removeFromColumn, reorderInColumn, sendRowOrderChanged };
}

export default useReorderRow;

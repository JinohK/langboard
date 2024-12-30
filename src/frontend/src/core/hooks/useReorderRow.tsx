import useRowOrderChangedHandlers, { IUseRowOrderChangedHandlersProps } from "@/controllers/socket/shared/useRowOrderChangedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { TBaseModelInstance } from "@/core/models/Base";
import { ISocketContext } from "@/core/providers/SocketProvider";

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

            forceUpdate();
        },
    });
    useSwitchSocketHandlers({ socket, handlers });

    const moveToColumn = <TRowColumn extends keyof TRow>(uid: string, index: number, columnId: TRow[TRowColumn]) => {
        let isUpdated = false;
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            if (i === index) {
                isUpdated = true;
                continue;
            }
            (allRowsMap[row.uid] as unknown as IRow).order = isUpdated ? i + 1 : i;
        }
        (allRowsMap[uid] as unknown as IRow).order = index;
        (allRowsMap[uid] as Record<keyof TRow, unknown>)[columnKey] = columnId;
    };

    const removeFromColumn = (uid: string) => {
        let isUpdated = false;
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i];
            if (row.uid === uid) {
                isUpdated = true;
                continue;
            }
            (allRowsMap[row.uid] as unknown as IRow).order = isUpdated ? i - 1 : i;
        }
    };

    const reorderInColumn = (uid: string, index: number) => {
        let isTargetCardPassed = false;
        for (let i = 0; i < rows.length; ++i) {
            const row = rows[i] as unknown as IRow;
            if (row.uid === uid) {
                isTargetCardPassed = true;
                continue;
            }

            let numToAdd = row.order <= index ? 0 : 1;
            numToAdd -= isTargetCardPassed ? 1 : 0;

            row.order = i + numToAdd;
        }
        (allRowsMap[uid] as unknown as IRow).order = index;
    };

    return { moveToColumn, removeFromColumn, reorderInColumn, sendRowOrderChanged: handlers.send };
}

export default useReorderRow;

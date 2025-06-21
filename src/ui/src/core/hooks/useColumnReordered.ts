import useColumnOrderChangedHandlers, { IUseColumnOrderChangedHandlersProps } from "@/controllers/socket/shared/useColumnOrderChangedHandlers";
import useSwitchSocketHandlers, { TSocketHandler } from "@/core/hooks/useSwitchSocketHandlers";
import { TBaseModelInstance } from "@/core/models/Base";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useMemo } from "react";

export interface IColumn {
    uid: string;
    order: number;
}

export interface IUseColumnReorderedProps<TColumn extends TBaseModelInstance<IColumn>> {
    type: IUseColumnOrderChangedHandlersProps["type"];
    eventNameParams?: IUseColumnOrderChangedHandlersProps["params"];
    topicId: string;
    columns: TColumn[];
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
    otherHandlers?: TSocketHandler[];
}

function useColumnReordered<TColumn extends TBaseModelInstance<IColumn>>({
    type,
    eventNameParams,
    topicId,
    columns: flatColumns,
    socket,
    updater,
    otherHandlers,
}: IUseColumnReorderedProps<TColumn>) {
    const [updated, forceUpdate] = updater;
    const columns = useMemo(() => flatColumns.sort((a, b) => a.order - b.order), [updated, flatColumns]);
    const handlers = useMemo(
        () =>
            useColumnOrderChangedHandlers({
                type,
                topicId,
                params: eventNameParams,
                sortedModels: columns,
                callback: () => {
                    forceUpdate();
                },
            }),
        [type, topicId, eventNameParams, columns, forceUpdate]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [handlers, ...(otherHandlers ?? [])],
        dependencies: [handlers, ...(otherHandlers ?? [])],
    });

    return { columns, sendColumnOrderChanged: handlers.send };
}

export default useColumnReordered;

import useRowOrderChangedHandlers, { IUseRowOrderChangedHandlersProps } from "@/controllers/socket/shared/useRowOrderChangedHandlers";
import useSwitchSocketHandlers, { TSocketHandler } from "@/core/hooks/useSwitchSocketHandlers";
import { TBaseModelInstance } from "@/core/models/Base";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useMemo } from "react";

export interface IRow {
    uid: string;
    order: number;
}

export interface IUseRowReorderedProps<TRow extends TBaseModelInstance<IRow>> {
    type: IUseRowOrderChangedHandlersProps["type"];
    eventNameParams?: IUseRowOrderChangedHandlersProps["params"];
    topicId: string;
    rows: TRow[];
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
    otherHandlers?: TSocketHandler[];
}

function useRowReordered<TRow extends TBaseModelInstance<IRow>>({
    type,
    eventNameParams,
    topicId,
    rows: flatRows,
    socket,
    updater,
    otherHandlers,
}: IUseRowReorderedProps<TRow>) {
    const [updated, forceUpdate] = updater;
    const rows = useMemo(() => flatRows.sort((a, b) => a.order - b.order), [updated, flatRows]);
    const handlers = useMemo(
        () =>
            useRowOrderChangedHandlers({
                type,
                topicId,
                params: eventNameParams,
                callback: () => {
                    forceUpdate();
                },
            }),
        [type, topicId, eventNameParams, forceUpdate]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [handlers, ...(otherHandlers ?? [])],
        dependencies: [handlers, ...(otherHandlers ?? [])],
    });

    return { rows, sendRowOrderChanged: handlers.send };
}

export default useRowReordered;

import useRowOrderChangedHandlers, { IUseRowOrderChangedHandlersProps } from "@/controllers/socket/shared/useRowOrderChangedHandlers";
import useSwitchSocketHandlers, { TSocketHandler } from "@/core/hooks/useSwitchSocketHandlers";
import { TPickedModel } from "@/core/models/ModelRegistry";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useMemo } from "react";

export interface IRow {
    uid: string;
    order: number;
}

export interface IUseRowReorderedProps<TRowModelName extends IUseRowOrderChangedHandlersProps["type"]> {
    type: TRowModelName;
    eventNameParams?: IUseRowOrderChangedHandlersProps["params"];
    topicId: string;
    rows: TPickedModel<TRowModelName>[];
    columnUID: string;
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
    otherHandlers?: TSocketHandler[];
}

function useRowReordered<TRowModelName extends IUseRowOrderChangedHandlersProps["type"]>({
    type,
    eventNameParams,
    topicId,
    rows: flatRows,
    columnUID,
    socket,
    updater,
    otherHandlers,
}: IUseRowReorderedProps<TRowModelName>) {
    const [updated, forceUpdate] = updater;
    const rows = useMemo(() => flatRows.sort((a, b) => a.order - b.order), [updated, flatRows]);
    const handlers = useMemo(
        () =>
            useRowOrderChangedHandlers({
                type,
                topicId,
                params: eventNameParams,
                callback: (data) => {
                    switch (data.move_type) {
                        case "from_column":
                            if (data.column_uid !== columnUID) {
                                return;
                            }
                            break;
                        case "in_column":
                            if (data.column_uid !== columnUID) {
                                return;
                            }
                            break;
                        case "to_column":
                            if (data.column_uid !== columnUID) {
                                return;
                            }
                            break;
                    }

                    forceUpdate();
                },
            }),
        [type, topicId, eventNameParams, columnUID, forceUpdate]
    );
    useSwitchSocketHandlers({
        socket,
        handlers: [handlers, ...(otherHandlers ?? [])],
        dependencies: [handlers, ...(otherHandlers ?? [])],
    });

    return { rows, sendRowOrderChanged: handlers.send };
}

export default useRowReordered;

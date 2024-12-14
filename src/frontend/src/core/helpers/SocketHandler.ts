import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { TEventName } from "@/core/stores/SocketStore";
import { format } from "@/core/utils/StringUtils";

export interface IBaseUseSocketHandlersProps<TResponse> {
    socket: ISocketContext;
    callback?: (data: TResponse) => void;
}

interface IBaseUseSocketHandlerProps<TResponse, TEvent> {
    socket: ISocketContext;
    topic?: ESocketTopic;
    id?: string;
    eventKey: string;
    onProps: {
        name: TEvent;
        params?: Record<string, string>;
        callback?: IBaseUseSocketHandlersProps<TResponse>["callback"];
        responseConverter?: (data: TResponse) => TResponse;
    };
    sendProps?: {
        name: TEvent;
        params?: Record<string, string>;
    };
}

interface INoneTopicUseSocketHandlerProps<TResponse> extends IBaseUseSocketHandlerProps<TResponse, Exclude<TEventName, "open" | "close" | "error">> {
    topic: ESocketTopic.None;
    id?: never;
    sendProps: {
        name: Exclude<TEventName, "open" | "close" | "error">;
        params?: Record<string, string>;
    };
}

interface ITopicUseSocketHandlerProps<TResponse> extends IBaseUseSocketHandlerProps<TResponse, Exclude<TEventName, "open" | "close" | "error">> {
    topic: Exclude<ESocketTopic, ESocketTopic.None>;
    id: string;
}

interface IDefaultEventsUseSocketHandlerProps<TResponse> extends IBaseUseSocketHandlerProps<TResponse, "open" | "close" | "error"> {
    topic?: never;
    id?: never;
    onProps: {
        name: "open" | "close" | "error";
        params?: never;
        callback?: IBaseUseSocketHandlersProps<TResponse>["callback"];
        responseConverter?: never;
    };
    sendProps?: never;
}

export type TUseSocketHandlerProps<TResponse> =
    | INoneTopicUseSocketHandlerProps<TResponse>
    | ITopicUseSocketHandlerProps<TResponse>
    | IDefaultEventsUseSocketHandlerProps<TResponse>;

const useSocketHandler = <TRequest, TResponse>(props: TUseSocketHandlerProps<TResponse>) => {
    const { socket, onProps, sendProps, eventKey } = props;
    const on = () => {
        const eventName = onProps.params ? format(onProps.name, onProps.params) : onProps.name;
        const event = (data: TResponse) => {
            if (onProps.responseConverter) {
                data = onProps.responseConverter(data);
            }

            onProps.callback?.(data);
        };

        socket.on<TResponse>({
            topic: props.topic as never,
            id: props.id,
            event: eventName,
            eventKey,
            callback: event,
        });

        return {
            off: () => {
                socket.off({
                    topic: props.topic as never,
                    id: props.id,
                    event: eventName,
                    eventKey: eventKey,
                    callback: event,
                });
            },
        };
    };

    const send = (data: TRequest) => {
        if (!sendProps) {
            return;
        }

        const eventName = sendProps.params ? format(sendProps.name, sendProps.params) : sendProps.name;
        socket.send({
            topic: props.topic as never,
            id: props.id,
            eventName,
            data,
        });
    };

    return {
        send,
        on,
    };
};

export default useSocketHandler;

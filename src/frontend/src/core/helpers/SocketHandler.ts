import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { TDefaultEvents, TEventName } from "@/core/stores/SocketStore";
import { format } from "@/core/utils/StringUtils";

export interface IBaseUseSocketHandlersProps<TResponse> {
    socket: ISocketContext;
    callback?: (data: TResponse) => void;
}

interface IBaseUseSocketHandlerProps<TResponse, TEvent> {
    socket: ISocketContext;
    topic?: ESocketTopic;
    topicId?: string;
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

interface INoneTopicUseSocketHandlerProps<TResponse> extends IBaseUseSocketHandlerProps<TResponse, Exclude<TEventName, TDefaultEvents>> {
    topic: ESocketTopic.None;
    topicId?: never;
    sendProps: {
        name: Exclude<TEventName, TDefaultEvents>;
        params?: Record<string, string>;
    };
}

interface ITopicUseSocketHandlerProps<TResponse> extends IBaseUseSocketHandlerProps<TResponse, Exclude<TEventName, TDefaultEvents>> {
    topic: Exclude<ESocketTopic, ESocketTopic.None>;
    topicId: string;
}

interface IDefaultEventsUseSocketHandlerProps<TResponse> extends IBaseUseSocketHandlerProps<TResponse, TDefaultEvents> {
    topic?: never;
    topicId?: never;
    onProps: {
        name: TDefaultEvents;
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
            topicId: props.topicId,
            event: eventName,
            eventKey,
            callback: event,
        });

        return {
            off: () => {
                socket.off({
                    topic: props.topic as never,
                    topicId: props.topicId,
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
            topicId: props.topicId,
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

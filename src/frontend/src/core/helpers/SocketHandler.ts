import ESocketTopic from "@/core/helpers/ESocketTopic";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { TDefaultEvents, TEventName } from "@/core/stores/SocketStore";
import { format } from "@/core/utils/StringUtils";

export interface IBaseUseSocketHandlersProps<TResponse> {
    callback?: (data: TResponse) => void;
}

interface IBaseUseSocketHandlerProps<TResponse, TRawResponse, TEvent> {
    topic?: ESocketTopic;
    topicId?: string;
    eventKey: string;
    onProps: {
        name: TEvent;
        params?: Record<string, string>;
        callback?: IBaseUseSocketHandlersProps<TResponse>["callback"];
        responseConverter?: (data: TRawResponse) => TResponse;
    };
    sendProps?: {
        name: TEvent;
        params?: Record<string, string>;
    };
}

interface INoneTopicUseSocketHandlerProps<TResponse, TRawResponse = TResponse>
    extends IBaseUseSocketHandlerProps<TResponse, TRawResponse, Exclude<TEventName, TDefaultEvents>> {
    topic: ESocketTopic.None;
    topicId?: never;
    sendProps: {
        name: Exclude<TEventName, TDefaultEvents>;
        params?: Record<string, string>;
    };
}

interface IGlobalTopicUseSocketHandlerProps<TResponse, TRawResponse = TResponse>
    extends IBaseUseSocketHandlerProps<TResponse, TRawResponse, Exclude<TEventName, TDefaultEvents>> {
    topic: ESocketTopic.Global;
    topicId?: never;
}

interface ITopicUseSocketHandlerProps<TResponse, TRawResponse = TResponse>
    extends IBaseUseSocketHandlerProps<TResponse, TRawResponse, Exclude<TEventName, TDefaultEvents>> {
    topic: Exclude<ESocketTopic, ESocketTopic.None>;
    topicId: string;
}

interface IDefaultEventsUseSocketHandlerProps<TResponse, TRawResponse = TResponse>
    extends IBaseUseSocketHandlerProps<TResponse, TRawResponse, TDefaultEvents> {
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

export type TUseSocketHandlerProps<TResponse, TRawResponse = TResponse> =
    | INoneTopicUseSocketHandlerProps<TResponse, TRawResponse>
    | IGlobalTopicUseSocketHandlerProps<TResponse, TRawResponse>
    | ITopicUseSocketHandlerProps<TResponse, TRawResponse>
    | IDefaultEventsUseSocketHandlerProps<TResponse, TRawResponse>;

const useSocketHandler = <TResponse, TRawResponse = TResponse, TRequest = unknown>(props: TUseSocketHandlerProps<TResponse, TRawResponse>) => {
    const socket = useSocketOutsideProvider();
    const { onProps, sendProps, eventKey } = props;
    const on = () => {
        const eventName = onProps.params ? format(onProps.name, onProps.params) : onProps.name;
        const event = (data: TResponse | TRawResponse) => {
            let newData;
            if (onProps.responseConverter) {
                newData = onProps.responseConverter(data as TRawResponse);
            } else {
                newData = data as unknown as TResponse;
            }

            onProps.callback?.(newData);
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
        topic: props.topic,
        topicId: props.topicId,
        eventKey,
        send,
        on,
    };
};

export default useSocketHandler;

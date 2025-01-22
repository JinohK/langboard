/* eslint-disable @typescript-eslint/no-explicit-any */
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { IStreamCallbackMap, useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { TDefaultEvents, TEventName } from "@/core/stores/SocketStore";
import { format } from "@/core/utils/StringUtils";

export interface IBaseUseSocketStreamHandlersProps {
    callbacks: IStreamCallbackMap<any, any, any>;
}

interface IBaseUseSocketStreamHandlerProps {
    topic?: ESocketTopic;
    topicId?: string;
    eventKey: string;
    onProps: {
        name: Exclude<TEventName, TDefaultEvents>;
        params?: Record<string, string>;
        callbacks: IStreamCallbackMap<any, any, any>;
    };
}

const useSocketStreamHandler = (props: IBaseUseSocketStreamHandlerProps) => {
    const socket = useSocketOutsideProvider();
    const { onProps, eventKey } = props;
    const on = () => {
        const eventName = onProps.params ? format(onProps.name, onProps.params) : onProps.name;
        const { callbacks } = onProps;
        socket.stream({
            topic: props.topic as never,
            topicId: props.topicId,
            event: eventName,
            eventKey,
            callbacks,
        });

        return () => {
            socket.streamOff({
                topic: props.topic as never,
                topicId: props.topicId,
                event: eventName,
                eventKey: eventKey,
                callbacks,
            });
        };
    };

    return {
        topic: props.topic,
        topicId: props.topicId,
        eventKey,
        on,
    };
};

export default useSocketStreamHandler;

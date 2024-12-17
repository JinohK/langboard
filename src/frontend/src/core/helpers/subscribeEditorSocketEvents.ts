import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { format } from "@/core/utils/StringUtils";

interface IEventCallback {
    user_ids: number[];
}

interface IBaseSubscribeEditorSocketEventsProps {
    socket: ISocketContext;
    topic: ESocketTopic;
    topicId?: string;
    onEventNames: {
        EDITOR_USERS: string;
        EDITOR_START_EDITING: string;
        EDITOR_STOP_EDITING: string;
    };
    eventNameFormatMap?: Record<string, string>;
    eventKey: string;
    getUsersSendEvent: string;
    getUsersSendEventData?: Record<string, unknown>;
    startCallback: (userIds: IEventCallback["user_ids"]) => void;
    stopCallback: (userIds: IEventCallback["user_ids"]) => void;
}

interface INoneTopicSubscribeEditorSocketEventsProps extends IBaseSubscribeEditorSocketEventsProps {
    topic: ESocketTopic.None;
    topicId?: never;
}

interface ITopicSubscribeEditorSocketEventsProps extends IBaseSubscribeEditorSocketEventsProps {
    topic: Exclude<ESocketTopic, ESocketTopic.None>;
    topicId: string;
}

export type TSubscribeEditorSocketEventsProps = INoneTopicSubscribeEditorSocketEventsProps | ITopicSubscribeEditorSocketEventsProps;

const subscribeEditorSocketEvents = ({
    socket,
    topic,
    topicId,
    onEventNames,
    eventNameFormatMap,
    eventKey,
    getUsersSendEvent,
    getUsersSendEventData,
    startCallback,
    stopCallback,
}: TSubscribeEditorSocketEventsProps) => {
    const getUsersEditingEvent = format(onEventNames.EDITOR_USERS, eventNameFormatMap ?? {});
    const startedEditingEvent = format(onEventNames.EDITOR_START_EDITING, eventNameFormatMap ?? {});
    const stoppedEditingEvent = format(onEventNames.EDITOR_STOP_EDITING, eventNameFormatMap ?? {});

    const events: [string, (data: IEventCallback) => void][] = [
        [
            getUsersEditingEvent,
            (data: IEventCallback) => {
                startCallback(data.user_ids);
                socket.off({
                    topic: topic as never,
                    topicId,
                    eventKey: `${eventKey}-${getUsersEditingEvent}`,
                    event: getUsersEditingEvent,
                    callback: events[0][1],
                });
                events.shift();
            },
        ],
        [
            startedEditingEvent,
            (data: IEventCallback) => {
                startCallback(data.user_ids);
            },
        ],
        [
            stoppedEditingEvent,
            (data: IEventCallback) => {
                stopCallback(data.user_ids);
            },
        ],
    ];

    events.forEach(([event, handler]) => {
        socket.on({
            topic: topic as never,
            topicId,
            eventKey: `${eventKey}-${event}`,
            event: event,
            callback: handler,
        });
    });

    socket.send({
        topic: topic as never,
        topicId,
        eventName: getUsersSendEvent,
        data: getUsersSendEventData,
    });

    return () => {
        events.forEach(([event, handler]) => {
            socket.off({
                topic: topic as never,
                topicId,
                eventKey: `${eventKey}-${event}`,
                event,
                callback: handler,
            });
        });
    };
};

export default subscribeEditorSocketEvents;

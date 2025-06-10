import ESocketTopic from "@/core/server/ESocketTopic";
import User from "@/models/User";

export type TSocketSendParams<TData = unknown> = { event: string; topic: ESocketTopic | string; topic_id?: string | string[]; data?: TData };

interface ISocketClient {
    get user(): User;
    subscribe(topic: ESocketTopic | string, topicId: string | string[]): Promise<void>;
    unsubscribe(topic: ESocketTopic | string, topicId: string | string[]): Promise<void>;
    send<TData = unknown>(event: TSocketSendParams<TData>): void;
    onClose(): Promise<void>;
}

export default ISocketClient;

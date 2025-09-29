import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IPullOllamaModelResponse {
    status: string;
    model: string;
    percent?: number;
    error?: string;
}

export interface IPullOllamaModelRequest {
    model: string;
}

const usePullOllamaModelHandlers = ({ callback }: IBaseUseSocketHandlersProps<IPullOllamaModelResponse>) => {
    return useSocketHandler<IPullOllamaModelResponse, IPullOllamaModelResponse, IPullOllamaModelRequest>({
        topic: ESocketTopic.OllamaManager,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "pull-ollama-model",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS,
            callback,
        },
        sendProps: {
            name: SocketEvents.CLIENT.SETTINGS.OLLAMA.PULL_MODEL,
        },
    });
};

export default usePullOllamaModelHandlers;

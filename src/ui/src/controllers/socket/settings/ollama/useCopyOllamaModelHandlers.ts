import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface ICopyOllamaModelResponse {
    model: string;
    copy_to: string;
}

export interface ICopyOllamaModelRequest {
    model: string;
    copy_to: string;
}

const useCopyOllamaModelHandlers = ({ callback }: IBaseUseSocketHandlersProps<ICopyOllamaModelResponse>) => {
    return useSocketHandler<ICopyOllamaModelResponse, ICopyOllamaModelResponse, ICopyOllamaModelRequest>({
        topic: ESocketTopic.OllamaManager,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "copy-ollama-model",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_COPIED,
            callback,
        },
        sendProps: {
            name: SocketEvents.CLIENT.SETTINGS.OLLAMA.COPY_MODEL,
        },
    });
};

export default useCopyOllamaModelHandlers;

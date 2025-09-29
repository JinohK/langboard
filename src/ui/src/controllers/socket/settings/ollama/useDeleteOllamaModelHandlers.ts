import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IDeleteOllamaModelResponse {
    model: string;
}

export interface IDeleteOllamaModelRequest {
    model: string;
}

const useDeleteOllamaModelHandlers = ({ callback }: IBaseUseSocketHandlersProps<IDeleteOllamaModelResponse>) => {
    return useSocketHandler<IDeleteOllamaModelResponse, IDeleteOllamaModelResponse, IDeleteOllamaModelRequest>({
        topic: ESocketTopic.OllamaManager,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "delete-ollama-model",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_DELETED,
            callback,
        },
        sendProps: {
            name: SocketEvents.CLIENT.SETTINGS.OLLAMA.DELETE_MODEL,
        },
    });
};

export default useDeleteOllamaModelHandlers;

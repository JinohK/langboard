import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { format } from "@/core/utils/StringUtils";

export interface IBaseUseSocketHandlersProps<TResponse> {
    socket: IConnectedSocket;
    callback?: (data: TResponse) => void;
}

export interface IUseSocketHandlerProps<TResponse> {
    socket: IConnectedSocket;
    onProps: {
        name: string;
        params?: Record<string, string>;
        callback?: IBaseUseSocketHandlersProps<TResponse>["callback"];
        responseConverter?: (data: TResponse) => TResponse;
    };
    sendProps: {
        name: string;
        params?: Record<string, string>;
    };
}

const useSocketHandler = <TRequest, TResponse>({ socket, onProps, sendProps }: IUseSocketHandlerProps<TResponse>) => {
    const on = () => {
        const eventName = onProps.params ? format(onProps.name, onProps.params) : onProps.name;
        const event = (data: TResponse) => {
            if (onProps.responseConverter) {
                data = onProps.responseConverter(data);
            }
            onProps.callback?.(data);
        };

        socket.on(eventName, event);

        return {
            off: () => {
                socket.off(eventName, event);
            },
        };
    };

    const send = (data: TRequest) => {
        const eventName = sendProps.params ? format(sendProps.name, sendProps.params) : sendProps.name;
        socket.send(eventName, data);
    };

    return {
        send,
        on,
    };
};

export default useSocketHandler;

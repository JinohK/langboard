import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IUseSocketErrorHandlersProps extends IBaseUseSocketHandlersProps<ErrorEvent> {
    eventKey: string;
}

const useSocketErrorHandlers = ({ socket, callback, eventKey }: IUseSocketErrorHandlersProps) => {
    return useSocketHandler<{}, ErrorEvent>({
        socket,
        eventKey,
        onProps: {
            name: "error",
            callback,
        },
    });
};

export default useSocketErrorHandlers;

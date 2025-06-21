import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IUseSocketErrorHandlersProps extends IBaseUseSocketHandlersProps<ErrorEvent> {
    eventKey: string;
}

const useSocketErrorHandlers = ({ callback, eventKey }: IUseSocketErrorHandlersProps) => {
    return useSocketHandler<ErrorEvent>({
        eventKey,
        onProps: {
            name: "error",
            callback,
        },
    });
};

export default useSocketErrorHandlers;

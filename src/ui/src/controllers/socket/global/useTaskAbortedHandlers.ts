import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

const useTaskAbortedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{ task_id: string }>) => {
    return useSocketHandler({
        topic: ESocketTopic.Global,
        eventKey: "task-aborted",
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.TASK_ABORTED,
            callback,
        },
    });
};

export default useTaskAbortedHandlers;

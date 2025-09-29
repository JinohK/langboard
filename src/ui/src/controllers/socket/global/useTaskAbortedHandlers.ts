import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

const useTaskAbortedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{ task_id: string }>) => {
    return useSocketHandler({
        topic: ESocketTopic.Global,
        eventKey: "task-aborted",
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.TASK_ABORTED,
            callback,
        },
    });
};

export default useTaskAbortedHandlers;

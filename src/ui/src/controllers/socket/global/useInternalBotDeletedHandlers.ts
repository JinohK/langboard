import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { InternalBotModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IInternalBotDeletedRawResponse {
    uid: string;
}

const useInternalBotDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IInternalBotDeletedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "internal-bot-deleted",
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.INTERNAL_BOTS.DELETED,
            callback,
            responseConverter: (data) => {
                InternalBotModel.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useInternalBotDeletedHandlers;

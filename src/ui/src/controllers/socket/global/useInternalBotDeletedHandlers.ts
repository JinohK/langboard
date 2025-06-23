import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { InternalBotModel } from "@/core/models";

export interface IInternalBotDeletedRawResponse {
    uid: string;
}

const useInternalBotDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IInternalBotDeletedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "internal-bot-deleted",
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.INTERNAL_BOTS.DELETED,
            callback,
            responseConverter: (data) => {
                InternalBotModel.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useInternalBotDeletedHandlers;

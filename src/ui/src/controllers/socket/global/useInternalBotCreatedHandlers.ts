/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { InternalBotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";

export interface IInternalBotCreatedRawResponse {
    uid: string;
}

const useInternalBotCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IInternalBotCreatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "internal-bot-created",
        onProps: {
            name: SOCKET_SERVER_EVENTS.GLOBALS.INTERNAL_BOTS.CREATED,
            callback,
            responseConverter: (data) => {
                const url = Utils.String.format(API_ROUTES.GLBOAL.INTERNAL_BOTS.GET, { bot_uid: data.uid });
                api.get(url, {
                    env: { interceptToast: true } as any,
                }).then((res) => {
                    InternalBotModel.Model.fromOne(res.data.internal_bot, true);
                });
                return {};
            },
        },
    });
};

export default useInternalBotCreatedHandlers;

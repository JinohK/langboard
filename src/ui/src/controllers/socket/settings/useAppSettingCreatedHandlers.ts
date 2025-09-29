/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing, SocketEvents } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IAppSettingCreatedRawResponse {
    uid: string;
}

const useAppSettingCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IAppSettingCreatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "app-setting-created",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.CREATED,
            callback,
            responseConverter: (data) => {
                const url = Utils.String.format(Routing.API.SETTINGS.GET, { uid: data.uid });
                api.get(url, {
                    env: { interceptToast: true } as any,
                }).then((res) => {
                    AppSettingModel.Model.fromOne(res.data.setting, true);
                });
                return {};
            },
        },
    });
};

export default useAppSettingCreatedHandlers;

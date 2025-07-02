/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
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
            name: SOCKET_SERVER_EVENTS.SETTINGS.CREATED,
            callback,
            responseConverter: (data) => {
                const url = Utils.String.format(API_ROUTES.SETTINGS.GET, { uid: data.uid });
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

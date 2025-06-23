import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";

export interface IAppSettingCreatedRawResponse {
    setting: AppSettingModel.Interface;
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
                AppSettingModel.Model.fromObject(data.setting, true);
                return {};
            },
        },
    });
};

export default useAppSettingCreatedHandlers;

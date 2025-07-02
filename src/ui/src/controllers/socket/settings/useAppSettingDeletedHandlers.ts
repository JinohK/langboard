import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IUseAppSettingDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    setting: AppSettingModel.TModel;
}

const useAppSettingDeletedHandlers = ({ callback, setting }: IUseAppSettingDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `app-setting-deleted-${setting.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.DELETED,
            params: { uid: setting.uid },
            callback,
            responseConverter: () => {
                AppSettingModel.Model.deleteModel(setting.uid);

                return {};
            },
        },
    });
};

export default useAppSettingDeletedHandlers;

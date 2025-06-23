import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";

export interface ISelectedAppSettingsDeletedRawResponse {
    uids: string[];
}

const useSelectedAppSettingsDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, ISelectedAppSettingsDeletedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "selected-global-relationship-deleted",
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.SELECTIONS_DELETED,
            callback,
            responseConverter: (data) => {
                AppSettingModel.Model.deleteModels(data.uids);

                return {};
            },
        },
    });
};

export default useSelectedAppSettingsDeletedHandlers;

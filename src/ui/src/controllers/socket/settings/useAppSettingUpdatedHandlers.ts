/* eslint-disable @typescript-eslint/no-explicit-any */
import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface IAppSettingUpdatedRawResponse {
    setting_type?: AppSettingModel.ESettingType;
    setting_name?: string;
    setting_value?: any;
    created_at?: Date;
    last_used_at?: Date;
    total_used_count?: number;
}

export interface IUseAppSettingUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    setting: AppSettingModel.TModel;
}

const useAppSettingUpdatedHandlers = ({ callback, setting }: IUseAppSettingUpdatedHandlersProps) => {
    return useSocketHandler<{}, IAppSettingUpdatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: `app-setting-updated-${setting.uid}`,
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.UPDATED,
            params: { uid: setting.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    setting[key] = value as never;
                });

                return {};
            },
        },
    });
};

export default useAppSettingUpdatedHandlers;

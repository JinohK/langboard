import Consumer from "@/core/broadcast/Consumer";
import Subscription from "@/core/socket/Subscription";
import TypeUtils from "@/core/utils/TypeUtils";

type TSocketPublishQueueData = {
    data: Record<string, unknown>;
    publish_models: TSocketPublishData[] | TSocketPublishData;
};

type TSocketPublishData = {
    topic: string;
    topic_id: string;
    event: string;
    data_keys?: string | string[];
    custom_data?: Record<string, unknown>;
};

const SocketConsumer = async (data: unknown) => {
    if (!TypeUtils.isObject<TSocketPublishQueueData>(data) || !data.data || !data.publish_models) {
        return;
    }

    const model = data.data;

    if (!TypeUtils.isArray(data.publish_models)) {
        data.publish_models = [data.publish_models];
    }

    const publishModels = data.publish_models;

    for (let i = 0; i < publishModels.length; ++i) {
        const publishData: Record<string, unknown> = {};
        const publishModel = publishModels[i];

        if (publishModel.data_keys) {
            if (!TypeUtils.isArray(publishModel.data_keys)) {
                publishModel.data_keys = [publishModel.data_keys];
            }

            for (let i = 0; i < publishModel.data_keys.length; ++i) {
                const key = publishModel.data_keys[i];
                if (model[key]) {
                    publishData[key] = model[key];
                }
            }
        }

        if (publishModel.custom_data) {
            Object.assign(publishData, publishModel.custom_data);
        }

        await Subscription.publish(publishModel.topic, publishModel.topic_id, publishModel.event, publishData);
    }
};

Consumer.register("socket_publish", SocketConsumer);

export default SocketConsumer;

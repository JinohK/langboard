from ..core.broadcast import FileReaderQueue, WorkerQueue
from ..core.routing import AppRouter, SocketTopic
from ..core.service import SocketPublishService


@FileReaderQueue.consume("socket_publish")
@WorkerQueue.consume("socket_publish")
async def socket_publish(data: dict):
    try:
        socket_model = SocketPublishService.parse(data)
    except Exception:
        return

    model = socket_model.data

    if not isinstance(socket_model.publish_models, list):
        socket_model.publish_models = [socket_model.publish_models]

    for publish_model in socket_model.publish_models:
        data = {}

        if publish_model.data_keys:
            if not isinstance(publish_model.data_keys, list):
                publish_model.data_keys = [publish_model.data_keys]

            for key in publish_model.data_keys:
                if key in model:
                    data[key] = model[key]

        if publish_model.custom_data:
            data.update(publish_model.custom_data)

        if isinstance(publish_model.topic, SocketTopic) or isinstance(publish_model.topic, str):
            topic = publish_model.topic
        else:
            topic = publish_model.topic.value

        await AppRouter.socket.publish(
            topic=topic,
            topic_id=publish_model.topic_id,
            event=publish_model.event,
            data=data,
        )

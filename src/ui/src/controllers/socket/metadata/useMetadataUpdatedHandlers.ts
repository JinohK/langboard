import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { MetadataModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IMetadataUpdatedRawResponse {
    key: string;
    value: string;
    old_key?: string;
}

export interface IUseMetadataUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    type: MetadataModel.TType;
    uid: string;
}

const useMetadataUpdatedHandlers = ({ callback, type, uid }: IUseMetadataUpdatedHandlersProps) => {
    let topic: ESocketTopic;
    switch (type) {
        case "card":
            topic = ESocketTopic.BoardCard;
            break;
        case "project_wiki":
            topic = ESocketTopic.BoardWikiPrivate;
            break;
    }

    return useSocketHandler<{}, IMetadataUpdatedRawResponse>({
        topic: topic,
        topicId: uid,
        eventKey: `metadata-updated-${topic}-${uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.METADATA.UPDATED,
            params: { uid },
            callback,
            responseConverter: (data) => {
                const metadata = MetadataModel.Model.getModel(uid);
                if (!metadata || metadata.type !== type) {
                    return {};
                }

                const newMetadata = { ...metadata.metadata };
                if (data.old_key && data.old_key !== data.key) {
                    delete newMetadata[data.old_key];
                }
                newMetadata[data.key] = data.value;
                metadata.metadata = newMetadata;
                return {};
            },
        },
    });
};

export default useMetadataUpdatedHandlers;

import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { MetadataModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IMetadataDeletedRawResponse {
    keys: string[];
}

export interface IUseMetadataDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    type: MetadataModel.TType;
    uid: string;
}

const useMetadataDeletedHandlers = ({ callback, type, uid }: IUseMetadataDeletedHandlersProps) => {
    let topic: ESocketTopic;
    switch (type) {
        case "card":
            topic = ESocketTopic.BoardCard;
            break;
        case "project_wiki":
            topic = ESocketTopic.BoardWikiPrivate;
            break;
    }

    return useSocketHandler<{}, IMetadataDeletedRawResponse>({
        topic: topic,
        topicId: uid,
        eventKey: `metadata-deleted-${topic}-${uid}`,
        onProps: {
            name: SocketEvents.SERVER.METADATA.DELETED,
            params: { uid },
            callback,
            responseConverter: (data) => {
                const metadata = MetadataModel.Model.getModel(uid);
                if (!metadata || metadata.type !== type) {
                    return {};
                }

                const newMetadata = { ...metadata.metadata };
                for (let i = 0; i < data.keys.length; ++i) {
                    const key = data.keys[i];
                    if (key in newMetadata) {
                        delete newMetadata[key];
                    }
                }
                metadata.metadata = newMetadata;
                return {};
            },
        },
    });
};

export default useMetadataDeletedHandlers;

import { IBaseModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends IBaseModel {
    icon?: string;
    sender_uid?: string;
    receiver_uid?: string;
    message: string;
    isReceived: bool;
}

export const transformFromApi = <TChatMessage extends Interface | Interface[]>(
    messages: TChatMessage
): TChatMessage extends Interface ? Interface : Interface[] => {
    if (!TypeUtils.isArray(messages)) {
        messages.isReceived = !messages.sender_uid;
        return messages as unknown as TChatMessage extends Interface ? Interface : Interface[];
    }

    for (let i = 0; i < messages.length; ++i) {
        messages[i].isReceived = !messages[i].sender_uid;
    }

    return messages as unknown as TChatMessage extends Interface ? Interface : Interface[];
};

import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface {
    uid: string;
    icon?: string;
    sender_id?: number;
    receiver_id?: number;
    message: string;
    isReceived: bool;
}

export const transformFromApi = <TChatMessage extends Interface | Interface[]>(
    messages: TChatMessage
): TChatMessage extends Interface ? Interface : Interface[] => {
    if (!TypeUtils.isArray(messages)) {
        messages.isReceived = !messages.sender_id;
        return messages as unknown as TChatMessage extends Interface ? Interface : Interface[];
    }

    for (let i = 0; i < messages.length; ++i) {
        messages[i].isReceived = !messages[i].sender_id;
    }

    return messages as unknown as TChatMessage extends Interface ? Interface : Interface[];
};

import { IBaseModel } from "@/core/models/Base";
import * as User from "@/core/models/User";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends IBaseModel {
    name: string;
    url: string;
    order: number;
    created_at: Date;
}

export interface IBoard extends Interface {
    user: User.Interface;
}

export const transformFromApi = <TAttachment extends Interface | Interface[]>(
    attachments: TAttachment
): TAttachment extends Interface ? Interface : Interface[] => {
    if (!TypeUtils.isArray(attachments)) {
        attachments.url = convertServerFileURL(attachments.url);
        attachments.created_at = new Date(attachments.created_at);
        return attachments as unknown as TAttachment extends Interface ? Interface : Interface[];
    }

    for (let i = 0; i < attachments.length; ++i) {
        attachments[i].url = convertServerFileURL(attachments[i].url);
        attachments[i].created_at = new Date(attachments[i].created_at);
    }

    return attachments as unknown as TAttachment extends Interface ? Interface : Interface[];
};

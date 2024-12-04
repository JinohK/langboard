import { convertServerFileURL } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    avatar?: string;
}

export const INDUSTRIES: string[] = ["Industry 1"];
export const PURPOSES: string[] = ["Purpose 1"];

export const transformFromApi = <TUser extends Interface | Interface[]>(users: TUser): TUser extends Interface ? Interface : Interface[] => {
    if (!TypeUtils.isArray(users)) {
        users.avatar = convertServerFileURL(users.avatar);
        return users as unknown as TUser extends Interface ? Interface : Interface[];
    }

    for (let i = 0; i < users.length; ++i) {
        users[i].avatar = convertServerFileURL(users[i].avatar);
    }

    return users as unknown as TUser extends Interface ? Interface : Interface[];
};

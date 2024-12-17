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

export const BOT_ID = -1;
export const GROUP_EMAIL_ID = -2;

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

export const isPresentableUnknownUser = (user: Interface): bool => {
    return user.id < 0;
};

export const isBot = (user: Interface): bool => {
    return user.id === BOT_ID;
};

export const createUnknownUser = (): Interface => {
    return {
        id: 0,
        firstname: "",
        lastname: "",
        email: "",
        username: "",
    };
};

export const createNoneEmailUser = (email: string): Interface => {
    return {
        id: GROUP_EMAIL_ID,
        firstname: email,
        lastname: "",
        email,
        username: "",
    };
};

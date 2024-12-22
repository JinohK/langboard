import { IBaseModel } from "@/core/models/Base";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends Omit<IBaseModel, "uid"> {
    uid: string | "0" | "-1" | "-2";
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    avatar?: string;
}

export const INDUSTRIES: string[] = ["Industry 1"];
export const PURPOSES: string[] = ["Purpose 1"];

export const BOT_UID = "-1";
export const GROUP_EMAIL_UID = "-2";

export const isPresentableUnknownUser = (user: Interface): bool => {
    return !isNaN(Number(user.uid)) && Number(user.uid) < 0;
};

export const isValidUser = (user: Interface): bool => {
    return TypeUtils.isString(user.uid) && !isPresentableUnknownUser(user);
};

export const filterValidUserUIDs = (users: Interface[]): string[] => {
    return users.map((user) => user.uid).filter((uid) => isValidUser({ uid } as Interface)) as string[];
};

export const isDeletedUser = (user: Interface): bool => {
    return user.uid === "0";
};

export const isBot = (user: Interface): bool => {
    return user.uid === BOT_UID;
};

export const createUnknownUser = (): Interface => {
    return {
        uid: "0",
        firstname: "",
        lastname: "",
        email: "",
        username: "",
    };
};

export const createNoneEmailUser = (email: string): Interface => {
    return {
        uid: GROUP_EMAIL_UID,
        firstname: email,
        lastname: "",
        email,
        username: "",
    };
};

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

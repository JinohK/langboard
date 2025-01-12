import useUserUpdatedHandlers from "@/controllers/socket/user/useUserUpdatedHandlers";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";
import createFakeModel from "@/core/models/FakeModel";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends Omit<IBaseModel, "uid"> {
    type: "user" | "unknown" | "bot" | "group_email";
    uid: string;
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    avatar?: string;
}

export const INDUSTRIES: string[] = ["Industry 1"];
export const PURPOSES: string[] = ["Purpose 1"];

class User<TInherit extends Interface = Interface> extends BaseModel<TInherit & Interface> {
    static readonly #pendingSubscribers: string[] = [];
    static readonly #subscribedUserUIDs: string[] = [];
    static #subscribeTimeout: NodeJS.Timeout | undefined = undefined;

    static get USER_TYPE() {
        return "user" as const;
    }
    static get UNKNOWN_TYPE() {
        return "unknown" as const;
    }
    static get BOT_TYPE() {
        return "bot" as const;
    }
    static get GROUP_EMAIL_TYPE() {
        return "group_email" as const;
    }

    static get MODEL_NAME() {
        return "User" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.#subscribeUser();
    }

    public static createUnknownUser(): User {
        const model = {
            type: User.UNKNOWN_TYPE,
            uid: "0",
            firstname: "",
            lastname: "",
            email: "",
            username: "",
            avatar: undefined,
        };

        return createFakeModel(model, User.createFakeMethodsMap(model));
    }

    public static createTempEmailUser(email: string): User {
        const model = {
            type: User.GROUP_EMAIL_TYPE,
            uid: "0",
            firstname: email,
            lastname: "",
            email,
            username: "",
            avatar: undefined,
        };

        return createFakeModel(model, User.createFakeMethodsMap(model));
    }

    public static convertModel(model: Interface): Interface {
        if (model.avatar) {
            model.avatar = convertServerFileURL(model.avatar);
        }
        return model;
    }

    public static createFakeMethodsMap<TMethodMap>(model: Interface): TMethodMap {
        const map = {
            isPresentableUnknownUser: () => model.type === User.BOT_TYPE || model.type === User.GROUP_EMAIL_TYPE,
            isValidUser: () => TypeUtils.isString(model.uid) && !map.isPresentableUnknownUser(),
            isDeletedUser: () => model.type === User.UNKNOWN_TYPE,
            isBot: () => model.type === User.BOT_TYPE,
        };
        return map as TMethodMap;
    }

    public get type() {
        return this.getValue("type");
    }
    public set type(value: Interface["type"]) {
        this.update({ type: value });
    }

    public get firstname() {
        return this.getValue("firstname");
    }
    public set firstname(value: string) {
        this.update({ firstname: value });
    }

    public get lastname() {
        return this.getValue("lastname");
    }
    public set lastname(value: string) {
        this.update({ lastname: value });
    }

    public get email() {
        return this.getValue("email");
    }
    public set email(value: string) {
        this.update({ email: value });
    }

    public get username() {
        return this.getValue("username");
    }
    public set username(value: string) {
        this.update({ username: value });
    }

    public get avatar() {
        return this.getValue("avatar");
    }
    public set avatar(value: string | undefined) {
        this.update({ avatar: value });
    }

    public isPresentableUnknownUser(type?: User["type"]) {
        if (!type) {
            type = this.type;
        }
        return type === User.BOT_TYPE || type === User.GROUP_EMAIL_TYPE;
    }

    public isValidUser() {
        return TypeUtils.isString(this.uid) && !this.isPresentableUnknownUser();
    }

    public isDeletedUser(type?: User["type"]) {
        if (!type) {
            type = this.type;
        }
        return type === User.UNKNOWN_TYPE;
    }

    public isBot(type?: User["type"]) {
        if (!type) {
            type = this.type;
        }
        return type === User.BOT_TYPE;
    }

    #subscribeUser() {
        if (!this.isValidUser() || User.#pendingSubscribers.includes(this.uid) || User.#subscribedUserUIDs.includes(this.uid)) {
            return;
        }

        if (User.#subscribeTimeout) {
            clearTimeout(User.#subscribeTimeout);
            User.#subscribeTimeout = undefined;
        }

        User.#pendingSubscribers.push(this.uid);

        User.#subscribeTimeout = setTimeout(() => {
            const socket = useSocketOutsideProvider();
            const userUIDs = User.#pendingSubscribers.splice(0);
            User.#subscribedUserUIDs.push(...userUIDs);

            socket.subscribe(ESocketTopic.User, userUIDs);
        }, 100);

        this.subscribeSocketEvents([useUserUpdatedHandlers], {
            user: this,
        });
    }
}

registerModel(User);

export type TModel = User;
export const Model = User;

export const filterValidUserUIDs = (users: User[]): string[] => {
    return users.filter((user) => user.isValidUser()).map((user) => user.uid);
};

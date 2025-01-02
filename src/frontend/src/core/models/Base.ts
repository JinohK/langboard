/* eslint-disable @typescript-eslint/no-explicit-any */
import TypeUtils from "@/core/utils/TypeUtils";
import { create, StoreApi, UseBoundStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { useEffect, useRef, useState } from "react";
import useSocketHandler from "@/core/helpers/SocketHandler";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { createUUID } from "@/core/utils/StringUtils";
import type { Model as AuthUserModel } from "@/core/models/AuthUser";
import type { Model as ActivityModel } from "@/core/models/Activity";
import type { Model as GlobalRelationshipTypeModel } from "@/core/models/GlobalRelationshipType";
import type { Model as ProjectModel } from "@/core/models/Project";
import type { Model as ProjectCardModel } from "@/core/models/ProjectCard";
import type { Model as ProjectCardAttachmentModel } from "@/core/models/ProjectCardAttachment";
import type { Model as ProjectCardCommentModel } from "@/core/models/ProjectCardComment";
import type { Model as ProjectCardRelationshipModel } from "@/core/models/ProjectCardRelationship";
import type { Model as ProjectCheckitemModel } from "@/core/models/ProjectCheckitem";
import type { Model as ProjectColumnModel } from "@/core/models/ProjectColumn";
import type { Model as ProjectLabelModel } from "@/core/models/ProjectLabel";
import type { Model as ProjectWikiModel } from "@/core/models/ProjectWiki";
import type { Model as UserModel } from "@/core/models/User";
import type { Model as UserGroupModel } from "@/core/models/UserGroup";
import createFakeModel from "@/core/models/FakeModel";

export interface IEditorContent {
    content: string;
}

export interface IBaseModel {
    uid: string;
}

export type TStateStore<T = any, V = undefined> = V extends undefined
    ? UseBoundStore<StoreApi<T>>
    : UseBoundStore<StoreApi<Omit<T, keyof V>>> & {
          [K in keyof V]: Record<string, UseBoundStore<StoreApi<V[K]>>>;
      };

interface IModelMap {
    AuthUser: typeof AuthUserModel;
    Activity: typeof ActivityModel;
    GlobalRelationshipType: typeof GlobalRelationshipTypeModel;
    Project: typeof ProjectModel;
    ProjectCard: typeof ProjectCardModel;
    ProjectCardAttachment: typeof ProjectCardAttachmentModel;
    ProjectCardComment: typeof ProjectCardCommentModel;
    ProjectCardRelationship: typeof ProjectCardRelationshipModel;
    ProjectCheckitem: typeof ProjectCheckitemModel;
    ProjectColumn: typeof ProjectColumnModel;
    ProjectLabel: typeof ProjectLabelModel;
    ProjectWiki: typeof ProjectWikiModel;
    User: typeof UserModel;
    UserGroup: typeof UserGroupModel;
}

export interface IModelNotifiersMap {
    CREATION: Partial<Record<keyof IModelMap, Record<string, [(model: BaseModel<any>) => bool, (models: BaseModel<any>[]) => void]>>>;
    DELETION: Partial<Record<keyof IModelMap, Record<string, (uids: string[]) => void>>>;
}

export type TBaseModelClass<TModel extends IBaseModel> = {
    MODEL_NAME: keyof IModelMap;
    FOREIGN_MODELS: Partial<Record<keyof TModel, string>>;
    convertModel(model: any): any;
    createFakeMethodsMap<TMethodMap>(model: TModel): TMethodMap;
    fromObject<TParent extends TBaseModelClass<any>, TModel extends IBaseModel>(
        this: TParent,
        model: Partial<TModel> & { uid: string },
        shouldNotify?: bool,
        createdModels?: BaseModel<TModel>[]
    ): InstanceType<TParent>;
    subscribe<TParent extends TBaseModelClass<any>>(
        this: TParent,
        type: "CREATION",
        key: string,
        notifier: (models: InstanceType<TParent>[]) => void,
        filter: (model: InstanceType<TParent>) => bool
    ): () => void;
    subscribe(type: "DELETION", key: string, notifier: (uids: string[]) => void): () => void;
    unsubscribe(type: keyof IModelNotifiersMap, key: string): void;
    new (model: Record<string, any>): BaseModel<TModel>;
};

export type TBaseModelInstance<TModel extends IBaseModel> = {
    [K in keyof TModel]: TModel[K];
} & InstanceType<TBaseModelClass<TModel>>;

const MODELS: IModelMap = {} as any;
export const registerModel = (model: TBaseModelClass<any>) => {
    MODELS[model.MODEL_NAME] = model as any;
};

type TModelStoreMap = {
    [TModelName in keyof IModelMap]: {
        [uid: string]: TBaseModelInstance<any>;
    };
};

type TModelSocketSubscriptionMap = {
    [TModelName in keyof IModelMap]: {
        [uid: string]: [ESocketTopic, string, string, (() => void)[]][];
    };
};

export abstract class BaseModel<TModel extends IBaseModel> {
    static #SOCKET = useSocketOutsideProvider();
    static #MODELS: Partial<TModelStoreMap> = {};
    static #NOTIFIERS: IModelNotifiersMap = {
        CREATION: {},
        DELETION: {},
    };
    static #socketSubscriptions: Partial<TModelSocketSubscriptionMap> = {};
    #mStore: TStateStore<TModel>;
    #foreignModelUIDs: Record<string, string[]> = {};
    #foreignModelVersions: Record<string, number> = {};

    static get FOREIGN_MODELS(): Partial<Record<string, string>> {
        return {};
    }

    static get MODEL_NAME(): keyof IModelMap {
        return this.constructor.name as any;
    }

    constructor(model: Record<string, any>) {
        this.#upsertForeignModel(model);

        this.#mStore = create(
            immer(() => ({
                ...model,
            }))
        ) as any;
    }

    public static fromObject<TParent extends TBaseModelClass<any>, TModel extends IBaseModel>(
        this: TParent,
        model: Partial<TModel> & { uid: string },
        shouldNotify: true,
        createdModels?: never
    ): InstanceType<TParent>;
    public static fromObject<TParent extends TBaseModelClass<any>, TModel extends IBaseModel>(
        this: TParent,
        model: Partial<TModel> & { uid: string },
        shouldNotify?: false,
        createdModels?: BaseModel<TModel>[]
    ): InstanceType<TParent>;
    public static fromObject<TParent extends TBaseModelClass<any>, TModel extends IBaseModel>(
        this: TParent,
        model: Partial<TModel> & { uid: string },
        shouldNotify: bool = false,
        createdModels?: BaseModel<TModel>[]
    ) {
        const modelName = this.MODEL_NAME;
        if (!BaseModel.#MODELS[modelName]) {
            BaseModel.#MODELS[modelName] = {};
        }

        const targetModel = BaseModel.#MODELS[modelName];

        if (!targetModel[model.uid]) {
            model = this.convertModel(model);
            targetModel[model.uid] = new this(model);
            if (shouldNotify) {
                if (BaseModel.#NOTIFIERS.CREATION[modelName]) {
                    Object.values(BaseModel.#NOTIFIERS.CREATION[modelName]).forEach(([filter, notifier]) => {
                        const target = targetModel[model.uid];
                        if (filter(target)) {
                            notifier([target]);
                        }
                    });
                }
            } else {
                if (createdModels) {
                    createdModels.push(targetModel[model.uid]);
                }
            }
        } else {
            targetModel[model.uid].update(model);
        }

        return targetModel[model.uid];
    }

    public static fromObjectArray<TParent extends TBaseModelClass<any>, TModel extends IBaseModel>(
        this: TParent,
        models: (Partial<TModel> & { uid: string })[],
        shouldNotify: bool = false
    ): InstanceType<TParent>[] {
        if (!shouldNotify) {
            return models.map((model) => this.fromObject(model, false));
        }

        const createdModels: BaseModel<TModel>[] = [];
        const resultModels = models.map((model) => this.fromObject(model, false, createdModels));
        if (createdModels.length > 0) {
            const modelName = this.MODEL_NAME;
            if (BaseModel.#NOTIFIERS.CREATION[modelName]) {
                Object.values(BaseModel.#NOTIFIERS.CREATION[modelName]!).forEach(([filter, notifier]) => notifier(createdModels.filter(filter)));
            }
        }
        return resultModels;
    }

    public static convertModel(model: any): any {
        return model;
    }

    public static createFakeMethodsMap<TMethodMap>(_: any): TMethodMap {
        return {} as TMethodMap;
    }

    public static subscribe<TParent extends TBaseModelClass<any>>(
        this: TParent,
        type: "CREATION",
        key: string,
        notifier: (models: InstanceType<TParent>[]) => void,
        filter: (model: InstanceType<TParent>) => bool
    ): () => void;
    public static subscribe(type: "DELETION", key: string, notifier: (uids: string[]) => void): () => void;
    public static subscribe<TParent extends TBaseModelClass<any>>(
        this: TParent,
        type: keyof IModelNotifiersMap,
        key: string,
        notifier: (models: InstanceType<TParent>[]) => void,
        filter?: (model: InstanceType<TParent>) => bool
    ) {
        const modelName = this.MODEL_NAME;
        if (!BaseModel.#NOTIFIERS[type][modelName]) {
            BaseModel.#NOTIFIERS[type][modelName] = {};
        }

        if (type === "CREATION") {
            BaseModel.#NOTIFIERS[type][modelName][key] = [filter, notifier] as any;
        } else {
            BaseModel.#NOTIFIERS[type][modelName][key] = notifier as any;
        }

        return () => {
            this.unsubscribe(type, key);
        };
    }

    public static unsubscribe(type: keyof IModelNotifiersMap, key: string) {
        const modelName = this.MODEL_NAME;
        if (!BaseModel.#NOTIFIERS[type]?.[modelName]) {
            return;
        }

        delete BaseModel.#NOTIFIERS[type][modelName][key];
    }

    public static getModel<TParent extends TBaseModelClass<any>>(this: TParent, uid: string): InstanceType<TParent> | undefined {
        return BaseModel.#MODELS[this.MODEL_NAME]?.[uid] as any;
    }

    public static getModels<TParent extends TBaseModelClass<any>>(this: TParent, uids: string[]): InstanceType<TParent>[] {
        const models: InstanceType<TParent>[] = [];
        for (let i = 0; i < uids.length; ++i) {
            const model = BaseModel.#MODELS[this.MODEL_NAME]?.[uids[i]];
            if (model) {
                models.push(model as any);
            }
        }
        return models;
    }

    public static useModels<TParent extends TBaseModelClass<any>>(
        this: TParent,
        filter: (model: InstanceType<TParent>) => bool,
        dependencies?: React.DependencyList
    ): InstanceType<TParent>[] {
        const [models, setModels] = useState<InstanceType<TParent>[]>(
            Object.values(BaseModel.#MODELS[this.MODEL_NAME] ?? {}).filter(filter as any) as any
        );

        useEffect(() => {
            const key = createUUID();
            const unsubscribeCreation = this.subscribe(
                "CREATION",
                key,
                (newModels) => {
                    if (newModels.length === 0) {
                        return;
                    }

                    setModels((prevModels) => [...prevModels, ...newModels]);
                },
                filter
            );
            const unsubscribeDeletion = this.subscribe("DELETION", key, (uids) => {
                if (uids.length === 0 || !models.some((model) => uids.includes(model.uid))) {
                    return;
                }

                setModels((prevModels) => prevModels.filter((model) => !uids.includes(model.uid)));
            });

            return () => {
                unsubscribeCreation();
                unsubscribeDeletion();
            };
        }, []);

        useEffect(() => {
            if (dependencies && dependencies.length > 0) {
                setModels(() => Object.values(BaseModel.#MODELS[this.MODEL_NAME] ?? {}).filter(filter as any) as any);
            }
        }, dependencies);

        return models;
    }

    public static deleteModel(uid: string) {
        const modelName = this.MODEL_NAME;
        if (!BaseModel.#MODELS[modelName]) {
            return;
        }

        delete BaseModel.#MODELS[modelName][uid];

        this.unsubscribeSocketEvents(uid);

        if (BaseModel.#NOTIFIERS.DELETION[modelName]) {
            Object.values(BaseModel.#NOTIFIERS.DELETION[modelName]).forEach((notifier) => notifier([uid]));
        }
    }

    public static deleteModels(uids: string[]) {
        const modelName = this.MODEL_NAME;
        if (!BaseModel.#MODELS[modelName]) {
            return;
        }

        for (let i = 0; i < uids.length; ++i) {
            const uid = uids[i];
            delete BaseModel.#MODELS[modelName][uid];

            this.unsubscribeSocketEvents(uid);
        }

        if (BaseModel.#NOTIFIERS.DELETION[modelName]) {
            Object.values(BaseModel.#NOTIFIERS.DELETION[modelName]).forEach((notifier) => notifier(uids));
        }
    }

    public static unsubscribeSocketEvents(uid: string) {
        const modelName = this.MODEL_NAME;
        if (!BaseModel.#socketSubscriptions[modelName]?.[uid]) {
            return;
        }

        BaseModel.#socketSubscriptions[modelName][uid].forEach(([topic, topicId, key, offs]) => {
            offs.forEach((off) => off());
            BaseModel.#SOCKET.unsubscribeTopicNotifier(topic, topicId, key);
        });
        delete BaseModel.#socketSubscriptions[modelName][uid];
    }

    public get uid() {
        return this.getValue("uid");
    }
    public set uid(value: string) {
        this.update({ uid: value } as any);
    }

    public asFake<TParent extends TBaseModelInstance<any>>(this: TParent): TParent {
        const constructor = this.#getConstructor();
        const model = {
            ...this.#mStore.getState(),
        };
        Object.keys(constructor.FOREIGN_MODELS).forEach((key) => {
            model[key] = this.getForeignModels<BaseModel<any>>(key as keyof IModelMap);
        });
        return createFakeModel(model, constructor.createFakeMethodsMap(this.#mStore.getState()), Object.keys(constructor.FOREIGN_MODELS));
    }

    public useField<TKey extends keyof TModel>(
        field: TKey,
        updatedCallback?: (newValue: TModel[TKey], oldValue: TModel[TKey]) => void
    ): TModel[TKey] {
        const [fieldValue, setFieldValue] = useState<TModel[TKey]>(this.getValue(field));

        useEffect(() => {
            const unsub = this.#mStore.subscribe((newValue) => {
                if (newValue[field] === fieldValue) {
                    return;
                }

                setTimeout(() => {
                    setFieldValue(newValue[field]);
                    updatedCallback?.(newValue[field], fieldValue);
                }, 0);
            });

            return () => {
                unsub();
            };
        }, [fieldValue]);

        return fieldValue;
    }

    public useForeignField<TForeignModel>(
        field: keyof TModel,
        updatedCallback?: (newValue: TForeignModel[], oldValue: TForeignModel[]) => void
    ): TForeignModel[] {
        const [fieldValue, setFieldValue] = useState<TForeignModel[]>(this.getForeignModels<TForeignModel>(field));
        const currentVersionRef = useRef(this.#getForeignModelVersions(field));

        useEffect(() => {
            setFieldValue(this.getForeignModels<TForeignModel>(field));

            const unsub = this.#mStore.subscribe((newValue) => {
                if (newValue[field] === currentVersionRef.current) {
                    return;
                }

                setTimeout(() => {
                    setFieldValue(this.getForeignModels<TForeignModel>(field));
                    updatedCallback?.(this.getForeignModels<TForeignModel>(field), fieldValue);
                    currentVersionRef.current = this.#getForeignModelVersions(field);
                }, 0);
            });
            return unsub;
        }, []);

        return fieldValue;
    }

    protected getValue<TKey extends keyof TModel>(field: TKey): TModel[TKey] {
        return this.#mStore.getState()[field];
    }

    protected getForeignModels<TForeignModel>(field: keyof TModel): TForeignModel[] {
        const constructor = this.#getConstructor();
        if (!constructor.FOREIGN_MODELS[field]) {
            return [];
        }

        const modelName = constructor.FOREIGN_MODELS[field] as keyof IModelMap;
        const uids = this.#getForeignModelUIDs(field);
        const models = [];
        for (let i = 0; i < uids.length; ++i) {
            const model = BaseModel.#MODELS[modelName]?.[uids[i]];
            if (!model) {
                continue;
            }
            models.push(BaseModel.#MODELS[modelName]![uids[i]]);
        }
        return models;
    }

    protected update<TUpdateModel extends Partial<TModel | TBaseModelInstance<any>>>(model: TUpdateModel) {
        this.#upsertForeignModel(model);
        model = this.#getConstructor().convertModel(model);

        this.#mStore.setState(
            produce((draft: any) => {
                Object.keys(model).forEach((field) => {
                    const value = model[field as keyof TUpdateModel];
                    if (TypeUtils.isArray(value)) {
                        if (!draft[field]) {
                            draft[field] = [];
                        }
                        draft[field].splice(0, draft[field].length, ...(value as any[]));
                    } else {
                        draft[field] = value;
                    }
                });
            })
        );
    }

    protected subscribeSocketEvents(events: ((props: any) => ReturnType<typeof useSocketHandler<any, any, any>>)[], props: any) {
        const modelName = this.#getConstructor().MODEL_NAME;
        if (!BaseModel.#socketSubscriptions[modelName]) {
            BaseModel.#socketSubscriptions[modelName] = {};
        }

        if (!BaseModel.#socketSubscriptions[modelName][this.uid]) {
            BaseModel.#socketSubscriptions[modelName][this.uid] = [];
        }

        const topicMap: Partial<Record<ESocketTopic, Record<string, ReturnType<typeof useSocketHandler>["on"][]>>> = {};
        for (let i = 0; i < events.length; ++i) {
            const handlers = events[i](props);
            if (!handlers.topic || !handlers.topicId) {
                continue;
            }

            if (!topicMap[handlers.topic]) {
                topicMap[handlers.topic] = {};
            }

            if (!topicMap[handlers.topic]![handlers.topicId]) {
                topicMap[handlers.topic]![handlers.topicId] = [];
            }

            topicMap[handlers.topic]![handlers.topicId].push(handlers.on);
        }

        Object.entries(topicMap).forEach(([topic, topicIdMap]) => {
            Object.entries(topicIdMap!).forEach(([topicId, handlers]) => {
                const key = createUUID();
                const offs: (() => void)[] = [];
                BaseModel.#SOCKET.subscribeTopicNotifier(topic, topicId, key, (subscribedTopicId, isSubscribed) => {
                    if (topicId !== subscribedTopicId) {
                        return;
                    }

                    if (isSubscribed) {
                        for (let i = 0; i < handlers.length; ++i) {
                            offs.push(handlers[i]().off);
                        }
                    } else {
                        offs.forEach((off) => off());
                        offs.splice(0);
                    }
                });

                BaseModel.#socketSubscriptions[modelName]![this.uid].push([topic, topicId, key, offs]);
            });
        });

        return () => {
            if (!BaseModel.#socketSubscriptions[modelName]?.[this.uid]) {
                return;
            }

            BaseModel.#socketSubscriptions[modelName][this.uid].forEach(([topic, topicId, key, offs]) => {
                if (!topicMap[topic]?.[topicId]) {
                    return;
                }

                offs.forEach((off) => off());
                BaseModel.#SOCKET.unsubscribeTopicNotifier(topic, topicId, key);
            });

            Object.keys(topicMap).forEach((topic) => {
                delete topicMap[topic];
            });
        };
    }

    #upsertForeignModel(model: Record<string, any>) {
        const foreignModels = this.#getConstructor().FOREIGN_MODELS;
        Object.keys<Record<string, any>>(foreignModels).forEach((key) => {
            if (!model[key]) {
                return;
            }

            const modelName = foreignModels[key as keyof TModel] as keyof IModelMap;

            if (!TypeUtils.isArray(model[key])) {
                model[key] = [model[key]];
            }

            const uids = this.#getForeignModelUIDs(key as keyof TModel);
            uids.splice(0);

            for (let i = 0; i < model[key].length; ++i) {
                const subModel = model[key][i];
                if (subModel instanceof BaseModel) {
                    if (!uids.includes(subModel.uid)) {
                        uids.push(subModel.uid);
                    }
                    continue;
                }

                MODELS[modelName].fromObject(subModel);
                if (!uids.includes(subModel.uid)) {
                    uids.push(subModel.uid);
                }
            }

            delete model[key];
            model[key] = this.#updateForeignModelVersions(key as keyof TModel);
        });
    }

    #getForeignModelUIDs(field: keyof TModel) {
        const foreignModels = this.#getConstructor().FOREIGN_MODELS;
        const fieldKey = `${field as string}.${foreignModels[field]}`;
        if (!this.#foreignModelUIDs[fieldKey]) {
            this.#foreignModelUIDs[fieldKey] = [];
        }

        return this.#foreignModelUIDs[fieldKey];
    }

    #getForeignModelVersions(field: keyof TModel) {
        const foreignModels = this.#getConstructor().FOREIGN_MODELS;
        const fieldKey = `${field as string}.${foreignModels[field]}`;
        if (!this.#foreignModelVersions[fieldKey]) {
            this.#foreignModelVersions[fieldKey] = 0;
        }

        return this.#foreignModelVersions[fieldKey];
    }

    #updateForeignModelVersions(field: keyof TModel) {
        const foreignModels = this.#getConstructor().FOREIGN_MODELS;
        const fieldKey = `${field as string}.${foreignModels[field]}`;

        this.#foreignModelVersions[fieldKey] = this.#getForeignModelVersions(field) + 1;
        return this.#foreignModelVersions[fieldKey];
    }

    #getConstructor(): TBaseModelClass<TModel> {
        return this.constructor as TBaseModelClass<TModel>;
    }
}

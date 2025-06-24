import type { IModelMap, TPickedModel, TPickedModelClass } from "@/core/models/ModelRegistry";
import { deleteDeepRecordMap, getDeepRecordMap } from "@/core/utils/ObjectUtils";
import { createUUID } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { useEffect, useMemo, useReducer, useState } from "react";

type TCommonModel = TPickedModel<keyof IModelMap>;
type TChildEdgeMap<TChild> = Partial<Record<keyof IModelMap, TChild>>;

type TParentEdgeMap<TChild> = {
    [uid: string]: TChildEdgeMap<TChild>;
};

type TEdgeMap<TChild> = Partial<Record<keyof IModelMap, TParentEdgeMap<TChild>>>;

type TSubscriptionMap = {
    CONNECTED: TEdgeMap<{ [key: string]: (uids: string[]) => void }>;
    DISCONNECTED: TEdgeMap<{ [uid: string]: { [key: string]: () => void } }>;
};

interface IBaseSubscriptionContext {
    event: keyof TSubscriptionMap;
    key: string;
    source: TCommonModel;
}

type TConnectedSubscriptionContext = IBaseSubscriptionContext & {
    event: "CONNECTED";
    targetClass: TPickedModelClass<keyof IModelMap>;
};

type TDisconnectedSubscriptionContext = IBaseSubscriptionContext & {
    event: "DISCONNECTED";
    target: TCommonModel;
};

type TConnectedSubscribeContext = TConnectedSubscriptionContext & {
    callback: (uids: string[]) => void;
};

type TDisconnectedSubscribeContext = TDisconnectedSubscriptionContext & {
    callback: () => void;
};

type TConnectedNotifyContext = Omit<TConnectedSubscriptionContext, "key"> & {
    uids: string[];
};

type TDisconnectedNotifyContext = Omit<TDisconnectedSubscriptionContext, "key" | "target"> & {
    target: { modelName: keyof IModelMap; uid: string };
};

type TSubscriptionContext = TConnectedSubscriptionContext | TDisconnectedSubscriptionContext;
type TSubscribeContext = TConnectedSubscribeContext | TDisconnectedSubscribeContext;
type TNotifyContext = TConnectedNotifyContext | TDisconnectedNotifyContext;

class _ModelEdgeStore {
    #edgeMap: TEdgeMap<Set<string>>;
    #subscriptions: TSubscriptionMap;

    constructor() {
        this.#edgeMap = {};
        this.#subscriptions = {
            CONNECTED: {},
            DISCONNECTED: {},
        };
    }

    public addEdge(source: TCommonModel, targets: TCommonModel | TCommonModel[]) {
        if (!TypeUtils.isArray(targets)) {
            targets = [targets];
        }

        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        const targetMap = getDeepRecordMap(true, this.#edgeMap, sourceModelName, source.uid);
        const notifierMap: Partial<Record<keyof IModelMap, [TPickedModelClass<keyof IModelMap>, string[]]>> = {};
        for (let i = 0; i < targets.length; ++i) {
            const target = targets[i];
            const targetModelName = this.#convertModelName(target.MODEL_NAME);
            if (!targetMap[targetModelName]) {
                targetMap[targetModelName] = new Set();
            }

            if (targetMap[targetModelName].has(target.uid)) {
                continue;
            }

            const targetConstructor = target.constructor as TPickedModelClass<keyof IModelMap>;
            targetMap[targetModelName].add(target.uid);
            if (!notifierMap[targetModelName]) {
                notifierMap[targetModelName] = [targetConstructor, []];
            }
            notifierMap[targetModelName][1].push(target.uid);

            const eventKey = `${sourceModelName}-${source.uid}-${targetModelName}-${target.uid}-edge`;
            targetConstructor.subscribe("DELETION", eventKey, (uids) => {
                if (uids.includes(target.uid)) {
                    this.removeEdge(source, target.uid, targetModelName);
                }
            });
            const unsub = this.subscribe({
                event: "DISCONNECTED",
                key: eventKey,
                source,
                target,
                callback: () => {
                    targetConstructor.unsubscribe("DELETION", eventKey);
                    unsub();
                },
            });
        }

        Object.keys(notifierMap).forEach((modelName) => {
            const [constructor, uids] = notifierMap[modelName] ?? [];
            if (!constructor || !uids?.length) {
                return;
            }

            this.#notify({
                event: "CONNECTED",
                source,
                targetClass: constructor,
                uids,
            });

            delete notifierMap[modelName];
        });
    }

    public removeEdge(source: TCommonModel, targets: TCommonModel | TCommonModel[]): void;
    public removeEdge(source: TCommonModel, targets: string | string[], modelName: keyof IModelMap): void;
    public removeEdge(source: TCommonModel, filter: (uid: string) => bool, modelName: keyof IModelMap): void;
    public removeEdge(
        source: TCommonModel,
        targets: TCommonModel | TCommonModel[] | string | string[] | ((uid: string) => bool),
        modelName?: keyof IModelMap
    ) {
        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        const targetMap = getDeepRecordMap(false, this.#edgeMap, sourceModelName, source.uid);
        if (!targetMap) {
            return;
        }

        if (TypeUtils.isFunction(targets)) {
            if (!modelName || !targetMap[modelName]) {
                return;
            }

            const filter = targets;
            const children = targetMap[modelName];
            Array.from(children).forEach((uid) => {
                if (!filter(uid)) {
                    return;
                }

                children.delete(uid);
                this.#notify({
                    event: "DISCONNECTED",
                    source,
                    target: { modelName, uid },
                });
            });
            return;
        }

        if (!TypeUtils.isArray(targets)) {
            targets = [targets as TCommonModel];
        }

        if (modelName) {
            if (!targetMap[modelName]) {
                return;
            }

            const children = targetMap[modelName];
            for (let i = 0; i < targets.length; ++i) {
                const target = targets[i];
                const targetUID = TypeUtils.isString(target) ? target : target.uid;
                children.delete(targetUID);
                this.#notify({
                    event: "DISCONNECTED",
                    source,
                    target: { modelName, uid: targetUID },
                });
            }
            return;
        }

        for (let i = 0; i < targets.length; ++i) {
            const target = targets[i];
            if (TypeUtils.isString(target)) {
                continue;
            }

            const targetModelName = this.#convertModelName(target.MODEL_NAME);
            if (!targetMap[targetModelName]) {
                continue;
            }

            const children = targetMap[targetModelName];
            children.delete(target.uid);
            this.#notify({
                event: "DISCONNECTED",
                source,
                target: { modelName: targetModelName, uid: target.uid },
            });
        }
    }

    public subscribe(context: TConnectedSubscribeContext): () => void;
    public subscribe(context: TDisconnectedSubscribeContext): () => void;
    public subscribe(context: TSubscribeContext): () => void {
        const { event, key, source, callback } = context;
        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        let targetMap;
        let targetModelName: keyof IModelMap;
        if (event === "CONNECTED") {
            targetModelName = this.#convertModelName(context.targetClass.MODEL_NAME);

            targetMap = getDeepRecordMap(true, this.#subscriptions.CONNECTED, sourceModelName, source.uid, targetModelName);
            targetMap[key] = callback;
            return () => {
                this.unsubscribe({
                    event: "CONNECTED",
                    key,
                    source,
                    targetClass: context.targetClass,
                });
            };
        }

        targetModelName = this.#convertModelName(context.target.MODEL_NAME);

        targetMap = getDeepRecordMap(true, this.#subscriptions.DISCONNECTED, sourceModelName, source.uid, targetModelName, context.target.uid);
        targetMap[key] = callback;

        return () => {
            this.unsubscribe({
                event: "DISCONNECTED",
                key,
                source,
                target: context.target,
            });
        };
    }

    public unsubscribe(context: TConnectedSubscriptionContext): void;
    public unsubscribe(context: TDisconnectedSubscriptionContext): void;
    public unsubscribe(context: TSubscriptionContext): void {
        const { event, key, source } = context;
        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        let targetModelName;
        if (event === "CONNECTED") {
            targetModelName = this.#convertModelName(context.targetClass.MODEL_NAME);
            deleteDeepRecordMap(this.#subscriptions.CONNECTED, sourceModelName, source.uid, targetModelName, key);
        } else {
            targetModelName = this.#convertModelName(context.target.MODEL_NAME);
            deleteDeepRecordMap(this.#subscriptions.DISCONNECTED, sourceModelName, source.uid, targetModelName, context.target.uid, key);
        }
    }

    public useModels<TTargetClass extends TPickedModelClass<keyof IModelMap>>(
        source: TCommonModel,
        targetClass: TTargetClass,
        deps?: React.DependencyList
    ): InstanceType<TTargetClass>[] {
        const store = this as _ModelEdgeStore;
        const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
        const models = useMemo(() => this.getModels(source, targetClass), [source, targetClass, updated]);
        const sourceModelName = store.#convertModelName(source.MODEL_NAME);
        const targetModelName = store.#convertModelName(targetClass.MODEL_NAME);

        useEffect(() => {
            const unsubs: (() => void)[] = models
                .map((model) => {
                    const key = `${sourceModelName}-${source.uid}-${targetModelName}-${model.uid}-${createUUID()}`;
                    const unsub = store.subscribe({
                        event: "DISCONNECTED",
                        key,
                        source,
                        target: model,
                        callback: () => {
                            forceUpdate();
                            unsub();
                        },
                    });
                    return unsub;
                })
                .concat(
                    store.subscribe({
                        event: "CONNECTED",
                        key: `${sourceModelName}-${source.uid}-${targetModelName}-${createUUID()}`,
                        targetClass,
                        source,
                        callback: (uids: string[]) => {
                            if (!uids.length) {
                                return;
                            }

                            forceUpdate();
                        },
                    })
                );

            return () => {
                for (let i = 0; i < unsubs.length; ++i) {
                    unsubs[i]();
                }

                unsubs.splice(0);
            };
        }, [source, models, forceUpdate, ...(deps || [])]);

        return models;
    }

    public getModels<TTargetClass extends TPickedModelClass<keyof IModelMap>>(
        source: TCommonModel,
        targetClass: TTargetClass
    ): InstanceType<TTargetClass>[] {
        const store = this as _ModelEdgeStore;
        const sourceModelName = store.#convertModelName(source.MODEL_NAME);
        const targetModelName = store.#convertModelName(targetClass.MODEL_NAME);
        return targetClass.getModels(
            Array.from(store.#edgeMap[sourceModelName]?.[source.uid]?.[targetModelName] ?? [])
        ) as InstanceType<TTargetClass>[];
    }

    public useModel<TTargetClass extends TPickedModelClass<keyof IModelMap>>(
        source: TCommonModel,
        targetClass: TTargetClass,
        targetUID: string,
        deps?: React.DependencyList
    ): InstanceType<TTargetClass> | undefined {
        const store = this as _ModelEdgeStore;
        const [model, setModel] = useState<InstanceType<TTargetClass> | undefined>(
            targetClass.getModel(targetUID) as InstanceType<TTargetClass> | undefined
        );
        const sourceModelName = store.#convertModelName(source.MODEL_NAME);
        const targetModelName = store.#convertModelName(targetClass.MODEL_NAME);

        useEffect(() => {
            if (!model) {
                return;
            }

            const key = `${sourceModelName}-${source.uid}-${targetModelName}-${model.uid}-${createUUID()}`;
            const unsub = store.subscribe({
                event: "DISCONNECTED",
                key,
                source,
                target: model,
                callback: () => {
                    setModel(undefined);
                    unsub();
                },
            });

            return () => {
                unsub();
            };
        }, [source, model, ...(deps || [])]);

        return model;
    }

    #convertModelName(name: keyof IModelMap): keyof IModelMap {
        if (name === "AuthUser") {
            return "User";
        }
        return name;
    }

    #notify(context: TNotifyContext): void {
        const { event, source } = context;
        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        let subscriptions;
        if (event === "CONNECTED") {
            subscriptions = getDeepRecordMap(false, this.#subscriptions.CONNECTED, sourceModelName, source.uid, context.targetClass.MODEL_NAME);
        } else {
            const { modelName, uid } = context.target;
            subscriptions = getDeepRecordMap(false, this.#subscriptions.DISCONNECTED, sourceModelName, source.uid, modelName, uid);
        }

        if (!subscriptions) {
            return;
        }

        Object.values(subscriptions).forEach((callback) => {
            if (event === "CONNECTED") {
                callback(context.uids);
            } else {
                (callback as () => void)();
            }
        });
    }
}

const ModelEdgeStore = new _ModelEdgeStore();

export default ModelEdgeStore;

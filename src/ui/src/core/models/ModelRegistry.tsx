/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Model as ActivityModel } from "@/core/models/ActivityModel";
import type { Model as AppSettingModel } from "@/core/models/AppSettingModel";
import type { Model as AuthUserModel } from "@/core/models/AuthUser";
import type { Model as BotModel } from "@/core/models/BotModel";
import type { Model as BotSchedule } from "@/core/models/BotSchedule";
import type { Model as ChatMessageModel } from "@/core/models/ChatMessageModel";
import type { Model as ChatTemplateModel } from "@/core/models/ChatTemplateModel";
import type { Model as GlobalRelationshipTypeModel } from "@/core/models/GlobalRelationshipType";
import type { Model as InternalBotModel } from "@/core/models/InternalBotModel";
import type { Model as MetadataModel } from "@/core/models/MetadataModel";
import type { Model as ProjectModel } from "@/core/models/Project";
import type { Model as ProjectCardModel } from "@/core/models/ProjectCard";
import type { Model as ProjectCardAttachmentModel } from "@/core/models/ProjectCardAttachment";
import type { Model as ProjectCardCommentModel } from "@/core/models/ProjectCardComment";
import type { Model as ProjectCardRelationshipModel } from "@/core/models/ProjectCardRelationship";
import type { Model as ProjectChecklistModel } from "@/core/models/ProjectChecklist";
import type { Model as ProjectCheckitemModel } from "@/core/models/ProjectCheckitem";
import type { Model as ProjectColumnModel } from "@/core/models/ProjectColumn";
import type { Model as ProjectLabelModel } from "@/core/models/ProjectLabel";
import type { Model as ProjectWikiModel } from "@/core/models/ProjectWiki";
import type { Model as UserModel } from "@/core/models/User";
import type { Model as UserGroupModel } from "@/core/models/UserGroup";
import type { Model as UserNotificationModel } from "@/core/models/UserNotification";
import { createContext, useContext } from "react";

export interface IModelMap {
    ActivityModel: IModelRegistry<typeof ActivityModel>;
    AppSettingModel: IModelRegistry<typeof AppSettingModel>;
    AuthUser: IModelRegistry<typeof AuthUserModel>;
    BotModel: IModelRegistry<typeof BotModel>;
    BotSchedule: IModelRegistry<typeof BotSchedule>;
    ChatMessageModel: IModelRegistry<typeof ChatMessageModel>;
    ChatTemplateModel: IModelRegistry<typeof ChatTemplateModel>;
    GlobalRelationshipType: IModelRegistry<typeof GlobalRelationshipTypeModel>;
    InternalBotModel: IModelRegistry<typeof InternalBotModel>;
    MetadataModel: IModelRegistry<typeof MetadataModel>;
    Project: IModelRegistry<typeof ProjectModel>;
    ProjectCard: IModelRegistry<typeof ProjectCardModel>;
    ProjectCardAttachment: IModelRegistry<typeof ProjectCardAttachmentModel>;
    ProjectCardComment: IModelRegistry<typeof ProjectCardCommentModel>;
    ProjectCardRelationship: IModelRegistry<typeof ProjectCardRelationshipModel>;
    ProjectChecklist: IModelRegistry<typeof ProjectChecklistModel>;
    ProjectCheckitem: IModelRegistry<typeof ProjectCheckitemModel>;
    ProjectColumn: IModelRegistry<typeof ProjectColumnModel>;
    ProjectLabel: IModelRegistry<typeof ProjectLabelModel>;
    ProjectWiki: IModelRegistry<typeof ProjectWikiModel>;
    User: IModelRegistry<typeof UserModel>;
    UserGroup: IModelRegistry<typeof UserGroupModel>;
    UserNotification: IModelRegistry<typeof UserNotificationModel>;
}

type TClass = abstract new (...args: any) => any;

interface IModelRegistry<TModel extends TClass, TRegistryParams = any> {
    Model: TModel;
    Provider: React.ComponentType<IModelProviderProps<TModel, TRegistryParams>>;
    Context: React.Context<IModelContext<TModel, TRegistryParams>>;
    useContext: <TParams = any>() => IModelContext<TModel, TParams>;
}

export interface IModelContext<TModel extends TClass, TParams = any> {
    model: InstanceType<TModel>;
    params: TParams;
}

interface IModelProviderProps<TModel extends TClass, TParams = any> {
    model: InstanceType<TModel>;
    params?: TParams;
    children: React.ReactNode;
}

export const ModelRegistry: IModelMap = {} as any;
export function registerModel<TModelName extends keyof IModelMap, TModel extends IModelMap[TModelName]["Model"]>(modelType: TModel) {
    const modelName = modelType.MODEL_NAME as TModelName;
    const ModelContext = createContext<IModelContext<TModel>>({
        model: null as InstanceType<TModel>,
        params: undefined,
    });

    function Provider({ model, params, children }: IModelProviderProps<TModel>): React.ReactNode {
        return (
            <ModelContext.Provider
                value={{
                    model,
                    params,
                }}
            >
                {children}
            </ModelContext.Provider>
        );
    }

    function useModel() {
        const ModelContext = ModelRegistry[modelName]["Context"];
        if (!ModelContext) {
            throw new Error(`Model context for ${modelName} is not registered.`);
        }

        const context = useContext(ModelContext as any);
        if (!context) {
            throw new Error(`useModel must be used within a ${modelName} Provider`);
        }
        return context;
    }

    ModelRegistry[modelName] = {
        Model: modelType,
        Provider,
        Context: ModelContext,
        useContext: useModel,
    } as any;
}

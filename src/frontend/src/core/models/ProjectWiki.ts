import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, IEditorContent, registerModel } from "@/core/models/Base";
import useBoardWikiCreatedHandlers from "@/controllers/socket/wiki/useBoardWikiCreatedHandlers";
import useBoardWikiDeletedHandlers from "@/controllers/socket/wiki/useBoardWikiDeletedHandlers";
import useBoardWikiPublicChangedHandlers from "@/controllers/socket/wiki/useBoardWikiPublicChangedHandlers";
import useBoardWikiDetailsChangedHandlers from "@/controllers/socket/wiki/useBoardWikiDetailsChangedHandlers";

export interface Interface extends IBaseModel {
    project_uid: string;
    title: string;
    content: IEditorContent;
    order: number;
    is_public: bool;
    forbidden?: true;
    assigned_members: User.Interface[];

    // variable set from the client side
    isInBin: bool;
}

class ProjectWiki extends BaseModel<Interface> {
    static get FOREIGN_MODELS() {
        return {
            assigned_members: User.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "ProjectWiki" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
        // Public handlers
        this.subscribeSocketEvents(
            [useBoardWikiCreatedHandlers, useBoardWikiDeletedHandlers, useBoardWikiDetailsChangedHandlers, useBoardWikiPublicChangedHandlers],
            {
                projectUID: this.project_uid,
                wikiUID: this.uid,
            }
        );
    }

    public subscribePrivateSocketHandlers(userUID: string) {
        return this.subscribeSocketEvents([useBoardWikiCreatedHandlers, useBoardWikiDetailsChangedHandlers, useBoardWikiPublicChangedHandlers], {
            projectUID: this.project_uid,
            wikiUID: this.uid,
            userUID,
        });
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value: string) {
        this.update({ project_uid: value });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value: string) {
        this.update({ title: value });
    }

    public get content() {
        return this.getValue("content");
    }
    public set content(value: IEditorContent) {
        this.update({ content: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }

    public get is_public() {
        return this.getValue("is_public");
    }
    public set is_public(value: bool) {
        this.update({ is_public: value });
    }

    public get assigned_members(): User.TModel[] {
        return this.getForeignModels("assigned_members");
    }
    public set assigned_members(value: (User.TModel | User.Interface)[]) {
        this.update({ assigned_members: value });
    }

    public get forbidden() {
        return this.getValue("forbidden");
    }
    public set forbidden(value: true | undefined) {
        this.update({ forbidden: value });
    }

    public get isInBin() {
        return this.getValue("isInBin") ?? false;
    }
    public set isInBin(value: bool) {
        this.update({ isInBin: value });
    }
}

registerModel(ProjectWiki);

export type TModel = ProjectWiki;
export const Model = ProjectWiki;

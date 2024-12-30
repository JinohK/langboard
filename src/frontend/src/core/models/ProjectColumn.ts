import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    project_uid: string;
    name: string;
    order: number;
}

export interface IStore extends Interface {
    count: number;
}

class ProjectColumn extends BaseModel<IStore> {
    static get MODEL_NAME() {
        return "ProjectColumn" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
        this.subscribeSocketEvents([useBoardCardCreatedHandlers], {
            projectUID: this.project_uid,
            columnUID: this.uid,
        });
    }

    public static createFakeMethodsMap<TMethodMap>(model: Interface): TMethodMap {
        const map = {
            isArchiveColumn: () => model.uid === model.project_uid,
        };
        return map as TMethodMap;
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value: string) {
        this.update({ project_uid: value });
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value: string) {
        this.update({ name: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }

    public get count() {
        return this.getValue("count");
    }
    public set count(value: number) {
        this.update({ count: value });
    }

    public isArchiveColumn() {
        return this.uid === this.project_uid;
    }
}

registerModel(ProjectColumn);

export type TModel = ProjectColumn;
export const Model = ProjectColumn;

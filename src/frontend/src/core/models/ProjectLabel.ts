import useBoardLabelDetailsChangedHandlers from "@/controllers/socket/board/label/useBoardLabelDetailsChangedHandlers";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    project_uid: string;
    name: string;
    color: string;
    description: string;
    order: number;
}

class ProjectLabel extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "ProjectLabel" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useBoardLabelDetailsChangedHandlers], {
            projectUID: this.project_uid,
            labelUID: this.uid,
        });
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

    public get color() {
        return this.getValue("color");
    }
    public set color(value: string) {
        this.update({ color: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value: string) {
        this.update({ description: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }
}

registerModel(ProjectLabel);

export type TModel = ProjectLabel;
export const Model = ProjectLabel;

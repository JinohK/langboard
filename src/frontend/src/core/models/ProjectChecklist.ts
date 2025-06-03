import useCardCheckitemCreatedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemCreatedHandlers";
import useCardCheckitemDeletedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemDeletedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import * as ProjectCheckitem from "@/core/models/ProjectCheckitem";

export interface Interface extends IBaseModel {
    card_uid: string;
    title: string;
    order: number;
    is_checked: bool;
}

export interface IStore extends Interface {
    checkitems?: ProjectCheckitem.Interface[];

    // variable set from the client side
    isOpenedInBoardCard: bool;
}

class ProjectChecklist extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            checkitems: ProjectCheckitem.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "ProjectChecklist" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useCardCheckitemCreatedHandlers, useCardCheckitemDeletedHandlers], {
            cardUID: this.card_uid,
            checklistUID: this.uid,
            checklist: this,
        });

        ProjectCheckitem.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.checkitems = [...this.checkitems, ...models];
            },
            (model) => model.checklist_uid === this.uid
        );
        ProjectCheckitem.Model.subscribe("DELETION", this.uid, (uids) => {
            this.checkitems = this.checkitems.filter((checkitem) => !uids.includes(checkitem.uid));
        });
    }

    public get card_uid() {
        return this.getValue("card_uid");
    }
    public set card_uid(value: string) {
        this.update({ card_uid: value });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value: string) {
        this.update({ title: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }

    public get checkitems(): ProjectCheckitem.TModel[] {
        return this.getForeignModels("checkitems");
    }
    public set checkitems(value: (ProjectCheckitem.TModel | ProjectCheckitem.Interface)[]) {
        this.update({ checkitems: value });
    }

    public get is_checked() {
        return this.getValue("is_checked");
    }
    public set is_checked(value: bool) {
        this.update({ is_checked: value });
    }

    public get isOpenedInBoardCard() {
        return this.getValue("isOpenedInBoardCard") ?? false;
    }
    public set isOpenedInBoardCard(value: bool) {
        this.update({ isOpenedInBoardCard: value });
    }
}

registerModel(ProjectChecklist);

export type TModel = ProjectChecklist;
export const Model = ProjectChecklist;

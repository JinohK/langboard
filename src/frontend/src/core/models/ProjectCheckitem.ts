import useCardCheckitemCardifiedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemCardifiedHandlers";
import useCardCheckitemDeletedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemDeletedHandlers";
import useCardCheckitemTimerStartedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStartedHandlers";
import useCardCheckitemTimerStoppedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStoppedHandlers";
import useCardCheckitemTitleChangedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTitleChangedHandlers";
import useCardSubCheckitemCreatedHandlers from "@/controllers/socket/card/checkitem/useCardSubCheckitemCreatedHandlers";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";
import * as ProjectCheckitemTimer from "@/core/models/ProjectCheckitemTimer";
import * as User from "@/core/models/User";

export interface Interface extends IBaseModel {
    card_uid: string;
    title: string;
    cardified_uid?: string;
    order: number;
}

export interface IStore extends Interface {
    project_uid: string;
    assigned_members: User.Interface[];
    timer?: ProjectCheckitemTimer.Interface;
    acc_time_seconds: number;
    checkitem_uid?: string;
    sub_checkitems?: IStore[];

    // variable set from the client side
    isOpenedInBoardCard: bool;
}

class ProjectCheckitem extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            assigned_members: User.Model.MODEL_NAME,
            sub_checkitems: ProjectCheckitem.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "ProjectCheckitem" as const;
    }

    constructor(model: Record<string, unknown>) {
        ProjectCheckitemTimer.transformFromApi(model.timer as ProjectCheckitemTimer.Interface | undefined);
        super(model);

        this.subscribeSocketEvents(
            [
                useCardSubCheckitemCreatedHandlers,
                useCardCheckitemDeletedHandlers,
                useCardCheckitemCardifiedHandlers,
                useCardCheckitemTitleChangedHandlers,
                useCardCheckitemTimerStartedHandlers,
                useCardCheckitemTimerStoppedHandlers,
            ],
            {
                projectUID: this.project_uid,
                checkitemUID: this.uid,
            }
        );

        if (!this.checkitem_uid) {
            ProjectCheckitem.subscribe(
                "CREATION",
                this.uid,
                (models) => {
                    this.sub_checkitems = [...this.sub_checkitems, ...models];
                },
                (model) => model.checkitem_uid === this.uid
            );
            ProjectCheckitem.subscribe("DELETION", this.uid, (uids) => {
                this.sub_checkitems = this.sub_checkitems.filter((checkitem) => !uids.includes(checkitem.uid));
            });
        }
    }

    public static convertModel(model: IStore): IStore {
        return model;
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value: string) {
        this.update({ project_uid: value });
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

    public get cardified_uid() {
        return this.getValue("cardified_uid");
    }
    public set cardified_uid(value: string | undefined) {
        this.update({ cardified_uid: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }

    public get assigned_members(): User.TModel[] {
        return this.getForeignModels("assigned_members");
    }
    public set assigned_members(value: (User.TModel | User.Interface)[]) {
        this.update({ assigned_members: value });
    }

    public get timer() {
        return this.getValue("timer");
    }
    public set timer(value: ProjectCheckitemTimer.Interface | undefined) {
        this.update({ timer: value });
    }

    public get acc_time_seconds() {
        return this.getValue("acc_time_seconds");
    }
    public set acc_time_seconds(value: number) {
        this.update({ acc_time_seconds: value });
    }

    public get checkitem_uid() {
        return this.getValue("checkitem_uid");
    }
    public set checkitem_uid(value: string | undefined) {
        this.update({ checkitem_uid: value });
    }

    public get sub_checkitems(): TModel[] {
        return this.getForeignModels("sub_checkitems");
    }
    public set sub_checkitems(value: (TModel | IStore)[]) {
        this.update({ sub_checkitems: value });
    }

    public get isOpenedInBoardCard() {
        return this.getValue("isOpenedInBoardCard") ?? false;
    }
    public set isOpenedInBoardCard(value: bool) {
        this.update({ isOpenedInBoardCard: value });
    }
}

registerModel(ProjectCheckitem);

export type TModel = ProjectCheckitem;
export const Model = ProjectCheckitem;

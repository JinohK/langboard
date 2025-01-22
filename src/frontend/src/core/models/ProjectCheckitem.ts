import * as ProjectCard from "@/core/models/ProjectCard";
import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";
import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import useCardCheckitemCardifiedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemCardifiedHandlers";
import useCardCheckitemCheckedChangedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemCheckedChangedHandlers";
import useCardCheckitemTitleChangedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTitleChangedHandlers";
import useCardCheckitemStatusChangedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemStatusChangedHandlers";

export enum ECheckitemStatus {
    Started = "started",
    Paused = "paused",
    Stopped = "stopped",
}

export interface Interface extends IBaseModel {
    card_uid: string;
    checklist_uid: string;
    cardified_card?: ProjectCard.IStore;
    user?: User.Interface;
    title: string;
    status: ECheckitemStatus;
    order: number;
    accumulated_seconds: number;
    is_checked: bool;
    initial_timer_started_at?: Date; // This will be used in tracking page of the dashboard
    timer_started_at?: Date;
}

class ProjectCheckitem extends BaseModel<Interface> {
    static get FOREIGN_MODELS() {
        return {
            cardified_card: ProjectCard.Model.MODEL_NAME,
            user: User.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "ProjectCheckitem" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents(
            [
                useCardCheckitemCardifiedHandlers,
                useCardCheckitemCheckedChangedHandlers,
                useCardCheckitemStatusChangedHandlers,
                useCardCheckitemTitleChangedHandlers,
            ],
            {
                cardUID: this.card_uid,
                checkitem: this,
            }
        );

        ProjectCard.Model.subscribe("DELETION", this.uid, (uids) => {
            if (!this.cardified_card || !uids.includes(this.cardified_card.uid)) {
                return;
            }
            this.cardified_card = undefined;
        });
    }

    public static convertModel(model: Interface): Interface {
        if (TypeUtils.isString(model.status)) {
            model.status = ECheckitemStatus[new StringCase(model.status).toPascal() as keyof typeof ECheckitemStatus];
        }
        if (TypeUtils.isString(model.initial_timer_started_at)) {
            model.initial_timer_started_at = new Date(model.initial_timer_started_at);
        }
        if (TypeUtils.isString(model.timer_started_at)) {
            model.timer_started_at = new Date(model.timer_started_at);
        }
        return model;
    }

    public get card_uid() {
        return this.getValue("card_uid");
    }
    public set card_uid(value: string) {
        this.update({ card_uid: value });
    }

    public get checklist_uid() {
        return this.getValue("checklist_uid");
    }
    public set checklist_uid(value: string) {
        this.update({ checklist_uid: value });
    }

    public get cardified_card(): ProjectCard.TModel | undefined {
        return this.getForeignModels<ProjectCard.TModel>("cardified_card")?.[0];
    }
    public set cardified_card(value: ProjectCard.TModel | ProjectCard.Interface | undefined) {
        this.update({ cardified_card: value });
    }

    public get user(): User.TModel | undefined {
        return this.getForeignModels<User.TModel>("user")?.[0];
    }
    public set user(value: User.TModel | User.Interface | undefined) {
        this.update({ user: value });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value: string) {
        this.update({ title: value });
    }

    public get status() {
        return this.getValue("status");
    }
    public set status(value: ECheckitemStatus) {
        this.update({ status: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }

    public get accumulated_seconds() {
        return this.getValue("accumulated_seconds");
    }
    public set accumulated_seconds(value: number) {
        this.update({ accumulated_seconds: value });
    }

    public get is_checked() {
        return this.getValue("is_checked");
    }
    public set is_checked(value: bool) {
        this.update({ is_checked: value });
    }

    public get initial_timer_started_at(): Date | undefined {
        return this.getValue("initial_timer_started_at");
    }
    public set initial_timer_started_at(value: string | Date | undefined) {
        this.update({ initial_timer_started_at: value });
    }

    public get timer_started_at(): Date | undefined {
        return this.getValue("timer_started_at");
    }
    public set timer_started_at(value: string | Date | undefined) {
        this.update({ timer_started_at: value });
    }
}

registerModel(ProjectCheckitem);

export type TModel = ProjectCheckitem;
export const Model = ProjectCheckitem;

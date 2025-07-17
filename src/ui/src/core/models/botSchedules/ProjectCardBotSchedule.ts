import * as BaseBotScheduleModel from "@/core/models/botSchedules/BaseBotScheduleModel";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends BaseBotScheduleModel.Interface {
    card_uid: string;
}

class ProjectCardBotSchedule extends BaseBotScheduleModel.Model<Interface> {
    public static get MODEL_NAME() {
        return "ProjectCardBotSchedule" as const;
    }

    public get card_uid() {
        return this.getValue("card_uid");
    }
    public set card_uid(value) {
        this.update({ card_uid: value });
    }
}

registerModel(ProjectCardBotSchedule);

export const Model = ProjectCardBotSchedule;
export type TModel = ProjectCardBotSchedule;

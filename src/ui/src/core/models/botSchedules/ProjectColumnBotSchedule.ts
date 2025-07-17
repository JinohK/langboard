import * as BaseBotScheduleModel from "@/core/models/botSchedules/BaseBotScheduleModel";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends BaseBotScheduleModel.Interface {
    project_column_uid: string;
}

class ProjectColumnBotSchedule extends BaseBotScheduleModel.Model<Interface> {
    public static get MODEL_NAME() {
        return "ProjectColumnBotSchedule" as const;
    }

    public get project_column_uid() {
        return this.getValue("project_column_uid");
    }
    public set project_column_uid(value) {
        this.update({ project_column_uid: value });
    }
}

registerModel(ProjectColumnBotSchedule);

export const Model = ProjectColumnBotSchedule;
export type TModel = ProjectColumnBotSchedule;

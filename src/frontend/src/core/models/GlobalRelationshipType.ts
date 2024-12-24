import { IBaseModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    parent_icon?: string;
    parent_name: string;
    child_icon?: string;
    child_name: string;
    description: string;
}

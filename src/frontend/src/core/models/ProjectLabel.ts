import { IBaseModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    name: string;
    color: string;
    description: string;
    order: number;
}

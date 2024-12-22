import { IBaseModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    name: string;
    order: number;
}

export interface IDashboard extends Interface {
    count: number;
}

export const TYPES = ["SI", "SW"];

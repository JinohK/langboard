import { IBaseModel } from "@/core/models/Base";
import * as ProjectCheckitemTimer from "@/core/models/ProjectCheckitemTimer";
import * as User from "@/core/models/User";

export interface Interface extends IBaseModel {
    title: string;
    cardified_uid?: string;
    order: number;
}

export interface IBaseBoard extends Interface {
    assigned_members: User.Interface[];
    timer?: ProjectCheckitemTimer.Interface;
    acc_time_seconds: number;
}

export interface IBoardSub extends IBaseBoard {
    checkitem_uid: string;
}

export interface IBoard extends IBaseBoard {
    sub_checkitems: IBoardSub[];
}

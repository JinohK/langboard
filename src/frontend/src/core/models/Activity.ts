import { IBaseModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    activity: {
        shared: Record<string, unknown>;
        old: Record<string, unknown> | null;
        new: Record<string, unknown>;
    };
    activity_type: string;
}

export interface Interface {
    id: number;
    activity: {
        shared: Record<string, unknown>;
        old: Record<string, unknown> | null;
        new: Record<string, unknown>;
    };
    activity_type: string;
}

export interface Interface {
    started_at: Date;
    stopped_at?: Date;
}

export const transformFromApi = <TTimer extends Interface | undefined>(timer?: TTimer): TTimer extends Interface ? Interface : undefined => {
    if (!timer) {
        return undefined as TTimer extends Interface ? Interface : undefined;
    }

    timer.started_at = new Date(timer.started_at);
    if (timer.stopped_at) {
        timer.stopped_at = new Date(timer.stopped_at);
    }
    return timer as unknown as TTimer extends Interface ? Interface : undefined;
};

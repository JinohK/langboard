export interface IStreamResponse {
    (params: {
        onMessage: (message: string) => void | Promise<void>;
        onEnd: () => void | Promise<void>;
        onError?: (error: Error) => void | Promise<void>;
    }): Promise<void>;
}

abstract class BaseConsumer {
    #emitters: Map<string, (data: unknown) => Promise<void>>;

    constructor() {
        this.#emitters = new Map();
    }

    public register(event: string, emitter: (data: unknown) => Promise<void>): void {
        if (this.#emitters.has(event)) {
            throw new Error(`Emitter for event "${event}" is already registered.`);
        }
        this.#emitters.set(event, emitter);
    }

    public abstract start(): Promise<void>;
    public abstract stop(): Promise<void>;

    protected async emit(event: string, data: unknown) {
        const emitter = this.#emitters.get(event);
        if (!emitter) {
            throw new Error(`No emitter registered for event: ${event}`);
        }

        await emitter(data);
    }

    protected getEmitterNames(): string[] {
        return Array.from(this.#emitters.keys());
    }
}

export default BaseConsumer;

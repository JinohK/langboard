import { BROADCAST_TYPE } from "@/Constants";
import BaseConsumer from "@/core/broadcast/BaseConsumer";
import InMemoryConsumer from "@/core/broadcast/InMemoryConsumer";
import KafkaConsumer from "@/core/broadcast/KafkaConsumer";

class _Consumer extends BaseConsumer {
    #consumer: BaseConsumer;

    constructor() {
        super();

        if (BROADCAST_TYPE === "in-memory") {
            this.#consumer = new InMemoryConsumer();
        } else if (BROADCAST_TYPE === "kafka") {
            this.#consumer = new KafkaConsumer();
        } else {
            throw new Error(`Unsupported broadcast type: ${BROADCAST_TYPE}`);
        }
    }

    public override register(event: string, emitter: (data: unknown) => Promise<void>): void {
        this.#consumer.register(event, emitter);
    }

    public async start() {
        if (this.#consumer) {
            await this.#consumer.start();
        } else {
            throw new Error(`Unsupported broadcast type: ${BROADCAST_TYPE}`);
        }
    }

    public async stop() {
        if (this.#consumer) {
            await this.#consumer.stop();
        } else {
            throw new Error(`Unsupported broadcast type: ${BROADCAST_TYPE}`);
        }
    }
}

const Consumer = new _Consumer();

export default Consumer;

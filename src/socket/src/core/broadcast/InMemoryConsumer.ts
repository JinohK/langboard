import { DATA_DIR } from "@/Constants";
import BaseConsumer from "@/core/broadcast/BaseConsumer";
import JsonUtils from "@/core/utils/JsonUtils";
import * as fs from "fs";
import * as path from "path";

class InMemoryConsumer extends BaseConsumer {
    static get BROADCAST_DIR() {
        return path.join(DATA_DIR, "broadcast");
    }
    #watcher!: fs.FSWatcher;

    public async start() {
        this.#runExistingFiles();

        this.#watcher = fs.watch(InMemoryConsumer.BROADCAST_DIR, {}, async (event, filename) => {
            if (event !== "rename" || !filename) {
                return;
            }

            filename = path.join(InMemoryConsumer.BROADCAST_DIR, filename);
            if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
                return;
            }

            const fileContent = fs.readFileSync(filename, "utf-8");

            try {
                const model: { event: string; data: unknown } = JsonUtils.Parse(fileContent);
                if (!model || !model.event) {
                    return;
                }

                await this.emit(model.event, model.data);
            } catch {
                // Ignore invalid JSON files
            }

            fs.unlinkSync(filename);
        });
    }

    public async stop() {
        this.#watcher?.close();
        this.#watcher = undefined!;
    }

    #runExistingFiles() {
        if (!fs.existsSync(InMemoryConsumer.BROADCAST_DIR)) {
            return;
        }

        const files = fs.readdirSync(InMemoryConsumer.BROADCAST_DIR);
        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            const filePath = path.join(InMemoryConsumer.BROADCAST_DIR, file);
            if (!fs.statSync(filePath).isFile()) {
                continue;
            }

            const fileContent = fs.readFileSync(filePath, "utf-8");
            try {
                const model: { event: string; data: unknown } = JsonUtils.Parse(fileContent);
                if (model && model.event) {
                    this.emit(model.event, model.data);
                }
            } catch {
                // Ignore invalid JSON files
            } finally {
                fs.unlinkSync(filePath);
            }
        }
    }
}

export default InMemoryConsumer;

import Consumer from "@/core/broadcast/Consumer";
import Cache from "@/core/caching/Cache";
import DB from "@/core/db/DB";
import Server from "@/core/server/Server";
import Logger from "@/core/utils/Logger";
import { Utils } from "@langboard/core/utils";

const EXIT_SIGNALS = [
    "SIGABRT",
    "SIGALRM",
    "SIGBUS",
    "SIGCHLD",
    "SIGCONT",
    "SIGFPE",
    "SIGHUP",
    "SIGILL",
    "SIGINT",
    "SIGIO",
    "SIGIOT",
    "SIGKILL",
    "SIGPIPE",
    "SIGPOLL",
    "SIGPROF",
    "SIGPWR",
    "SIGQUIT",
    "SIGSEGV",
    "SIGSTKFLT",
    "SIGSTOP",
    "SIGSYS",
    "SIGTERM",
    "SIGTRAP",
    "SIGTSTP",
    "SIGTTIN",
    "SIGTTOU",
    "SIGUNUSED",
    "SIGURG",
    "SIGUSR1",
    "SIGUSR2",
    "SIGVTALRM",
    "SIGWINCH",
    "SIGXCPU",
    "SIGXFSZ",
    "SIGBREAK",
    "SIGLOST",
    "SIGINFO",
    "beforeExit",
];

for (let i = 0; i < EXIT_SIGNALS.length; ++i) {
    const signal = EXIT_SIGNALS[i];
    try {
        process.on(signal, async () => {
            Logger.green("Shutting down gracefully...\n");

            await Consumer.stop();
            await Cache.stop();
            try {
                Server.destroy();
            } catch {
                // Silently ignore any errors during DB shutdown
            }
            try {
                await DB.destroy();
            } catch {
                // Silently ignore any errors during DB shutdown
            }

            process.exit(0);
        });
    } catch {
        continue;
    }
}

const ERROR_SIGNALS = ["uncaughtException", "unhandledRejection"];

for (let i = 0; i < ERROR_SIGNALS.length; ++i) {
    const signal = ERROR_SIGNALS[i];
    process.on(signal, (error) => {
        if (Utils.Type.isError(error)) {
            if (error.message.includes("address already in use")) {
                Logger.red("Port is already in use. Please stop the server before restarting.\n");
                return;
            }
        }
        Logger.red(`Error occurred: ${error}\n`);
        Logger.cyan("Restarting the server...\n");

        Server.restart();
    });
}

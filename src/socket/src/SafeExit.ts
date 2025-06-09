import Consumer from "@/core/broadcast/Consumer";
import DB from "@/core/db/DB";
import Server from "@/core/socket/Server";
import Terminal from "@/core/utils/Terminal";
import TypeUtils from "@/core/utils/TypeUtils";

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
            Terminal.green("Shutting down gracefully...\n");

            await Consumer.stop();
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
        if (TypeUtils.isError(error)) {
            if (error.message.includes("address already in use")) {
                Terminal.red("Port is already in use. Please stop the server before restarting.\n");
                return;
            }
        }
        Terminal.red(`Error occurred: ${error}\n`);
        Terminal.cyan("Restarting the server...\n");

        Server.restart();
    });
}

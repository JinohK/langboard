import { createRequire } from "module";
import { Terminal as TTerminal } from "terminal-kit";
const require = createRequire(import.meta.url);
const Terminal: TTerminal = require("terminal-kit").terminal;

export default Terminal;

import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import globals from "./package.json" with { type: "json" };
import fs from "fs";

if (!fs.existsSync("./dist")) {
    fs.mkdirSync("./dist");
}

const getExternal = (type) => {
    return [...Object.keys(globals[type]), ...Object.keys(globals[type]).map((dep) => new RegExp(`^${dep}(/.*)?`))];
};

const getDirname = (...chunks) => chunks.filter(Boolean).join("/");

/** @type {(dirname?: string) => import('rollup').RollupOptions[]} */
const createOptions = (dirname) => [
    {
        input: getDirname("src", dirname, "index.ts"),
        output: [
            {
                file: getDirname("dist", dirname, "index.mjs"),
                format: "esm",
                sourcemap: true,
            },
            {
                file: getDirname("dist", dirname, "index.cjs"),
                format: "cjs",
                sourcemap: true,
            },
        ],
        plugins: [resolve(), commonjs(), typescript()],
        external: [...getExternal("dependencies"), ...getExternal("devDependencies")],
        cache: false,
    },
    {
        input: getDirname("src", dirname, "index.ts"),
        output: {
            file: getDirname("dist", dirname, "index.d.ts"),
            format: "es",
        },
        plugins: [resolve(), typescript(), dts()],
        cache: false,
    },
];

const dirnames = [];
fs.readdirSync("src").forEach((file) => {
    if (fs.statSync(`src/${file}`).isDirectory()) {
        dirnames.push(file);
    }
});

export default [
    ...dirnames.map((dirname) => createOptions(dirname)).flat(),
    {
        input: getDirname("src", "global.d.ts"),
        output: {
            file: getDirname("dist", "global.d.ts"),
            format: "es",
        },
        plugins: [dts()],
        cache: false,
    },
];

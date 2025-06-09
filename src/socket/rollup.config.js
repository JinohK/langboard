import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import globals from "./package.json" with { type: "json" };

const getExternal = (type) => {
    return [...Object.keys(globals[type]), ...Object.keys(globals[type]).map((dep) => new RegExp(`^${dep}(/.*)?`))];
};

/** @type {import('rollup').RollupOptions} */
export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/index.js",
            format: "esm",
            sourcemap: true,
        },
    ],
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            outputToFilesystem: true,
        }),
    ],
    external: [...getExternal("dependencies"), ...getExternal("devDependencies")],
    cache: false,
};

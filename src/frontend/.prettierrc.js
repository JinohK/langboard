/**
 * @type {import("prettier").Options}
 */
const config = {
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindConfig: "./tailwind.config.js",
    singleQuote: false,
    semi: true,
    tabWidth: 4,
    trailingComma: "es5",
    printWidth: 150,
};

export default config;

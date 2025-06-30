/**
 * @type {import("prettier").Options}
 */
const config = {
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindConfig: "./tailwind.config.js",
    singleQuote: false,
    endOfLine: "lf",
    semi: true,
    tabWidth: 4,
    trailingComma: "es5",
    printWidth: 150,
    overrides: [
        {
            files: "*.json",
            options: {
                tabWidth: 2,
            },
        },
    ],
};

export default config;

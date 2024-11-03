const config = {
    plugins: ["prettier-plugin-tailwindcss", "@trivago/prettier-plugin-sort-imports"],
    tailwindConfig: "./tailwind.config.js",
    singleQuote: false,
    semi: true,
    tabWidth: 4,
    trailingComma: "es5",
    printWidth: 150,
    importOrder: ["<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
};

export default config;

export default {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        "postcss-replace": {
            pattern: /(--tw|\*, ::before, ::after)/g,
            data: {
                "--tw": `--${process.env.PROJECT_SHORT_NAME}`,
                "*, ::before, ::after": ":root",
            },
        },
    },
};
